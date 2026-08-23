import Student from "../model/studentModel.js";
import Payment from "../model/paymentModel.js";
import Video from "../model/videoModel.js";

/**
 * Normalize a student's enrollment data into a consistent array of
 * { institute, batch } objects.
 *
 * Priority:
 * 1. If student.enrollments exists and is a non-empty array, use it directly.
 * 2. Otherwise, derive from legacy flat fields (institute[] + batch string).
 *    Each legacy institute is paired with the single batch value.
 */
function normalizeEnrollments(student) {
    if (Array.isArray(student.enrollments) && student.enrollments.length > 0) {
        return student.enrollments.map((e) => ({
            institute: e.institute,
            batch: e.batch,
        }));
    }

    // Legacy fallback
    const institutes = Array.isArray(student.institute)
        ? student.institute
        : [student.institute].filter(Boolean);
    const batch = student.batch || "";

    if (institutes.length === 0) {
        return [];
    }

    return institutes.map((inst) => ({ institute: inst, batch }));
}

/**
 * Get the authenticated student's registrations with payment status.
 *
 * Returns each institute + batch combination the student is registered for,
 * along with whether payment exists for the current month.
 */
export async function getStudentRegistrations(req, res) {
    req.log.debug("--> getStudentRegistrations controller hit");
    try {
        const studentMongoId = req.user.id;

        const student = await Student.findById(studentMongoId).select("-password");
        if (!student) {
            req.log.warn({ id: studentMongoId }, "LMS: Student not found");
            return res.status(404).json({ message: "Student not found" });
        }

        const currentMonth = new Date().toISOString().slice(0, 7); // "2026-08"

        // Use normalized enrollments (supports both new and legacy data)
        const enrollments = normalizeEnrollments(student);

        const registrations = [];

        for (const enrollment of enrollments) {
            // Check if a PAID payment exists for this institute + batch + current month
            const payment = await Payment.findOne({
                studentId: student.studentId,
                institute: enrollment.institute,
                batch: enrollment.batch,
                month: currentMonth,
                status: "PAID",
            });

            registrations.push({
                institute: enrollment.institute,
                batch: enrollment.batch,
                isPaid: !!payment,
                month: currentMonth,
            });
        }

        req.log.info(
            { studentId: student.studentId, registrationCount: registrations.length },
            "Student registrations retrieved for LMS"
        );

        return res.json({
            studentName: `${student.firstName} ${student.lastName}`,
            registrations,
        });
    } catch (err) {
        req.log.error(err, "Unhandled error inside getStudentRegistrations controller");
        return res.status(500).json({ message: "Error fetching registrations", error: err.message });
    }
}

/**
 * Get videos for a specific institute + batch, with full authorization.
 *
 * Query params: ?institute=X&batch=Y
 *
 * Authorization checks:
 * 1. Student is authenticated (JWT verified by middleware)
 * 2. Student is registered for the EXACT requested institute+batch pair
 * 3. Student has a PAID payment for this institute+batch+current month
 * 4. Only active videos for that institute+batch are returned
 */
export async function getVideosForCategory(req, res) {
    req.log.debug("--> getVideosForCategory controller hit");
    try {
        const studentMongoId = req.user.id;
        const { institute, batch } = req.query;

        if (!institute || !batch) {
            return res.status(400).json({ message: "Institute and batch are required" });
        }

        // 1. Fetch actual student record from DB (never trust frontend data)
        const student = await Student.findById(studentMongoId).select("-password");
        if (!student) {
            req.log.warn({ id: studentMongoId }, "LMS videos: Student not found");
            return res.status(404).json({ message: "Student not found" });
        }

        // 2. Verify student is registered for the EXACT institute+batch pair
        const enrollments = normalizeEnrollments(student);
        const isEnrolled = enrollments.some(
            (e) => e.institute === institute && e.batch === batch
        );

        if (!isEnrolled) {
            req.log.warn(
                { studentId: student.studentId, requestedInstitute: institute, requestedBatch: batch },
                "LMS: Student not enrolled for requested institute+batch pair"
            );
            return res.status(403).json({ message: "Access denied. Not registered for this institute and batch." });
        }

        // 3. Verify PAID payment for this institute + batch + current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const payment = await Payment.findOne({
            studentId: student.studentId,
            institute: institute,
            batch: batch,
            month: currentMonth,
            status: "PAID",
        });

        if (!payment) {
            req.log.info(
                { studentId: student.studentId, institute, batch, month: currentMonth },
                "LMS: Payment not found — access denied"
            );
            return res.status(403).json({
                message: "Payment required to access these classes.",
                isPaid: false,
            });
        }

        // 4. Fetch active videos for this institute + batch
        // Supports both new targets array and legacy single institute/batch fields
        const videos = await Video.find({
            isActive: true,
            $or: [
                { targets: { $elemMatch: { institute: institute, batch: batch } } },
                { institute: institute, batch: batch },
            ],
        }).sort({ createdAt: -1 });

        req.log.info(
            { studentId: student.studentId, institute, batch, videoCount: videos.length },
            "LMS videos returned successfully"
        );

        return res.json({ videos });
    } catch (err) {
        req.log.error(err, "Unhandled error inside getVideosForCategory controller");
        return res.status(500).json({ message: "Error fetching videos", error: err.message });
    }
}

