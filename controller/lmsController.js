import Student from "../model/studentModel.js";
import Payment from "../model/paymentModel.js";
import Video from "../model/videoModel.js";

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

        // Build institute+batch combinations from the student's actual data
        const institutes = Array.isArray(student.institute) ? student.institute : [student.institute];
        const batch = student.batch;

        const registrations = [];

        for (const inst of institutes) {
            // Check if a PAID payment exists for this institute + batch + current month
            const payment = await Payment.findOne({
                studentId: student.studentId,
                institute: inst,
                batch: batch,
                month: currentMonth,
                status: "PAID",
            });

            registrations.push({
                institute: inst,
                batch: batch,
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
 * 2. Student is registered for the requested institute
 * 3. Student's batch matches the requested batch
 * 4. Student has a PAID payment for this institute+batch+current month
 * 5. Only active videos for that institute+batch are returned
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

        // 2. Verify student is registered for the requested institute
        const institutes = Array.isArray(student.institute) ? student.institute : [student.institute];
        if (!institutes.includes(institute)) {
            req.log.warn(
                { studentId: student.studentId, requestedInstitute: institute },
                "LMS: Student not registered for requested institute"
            );
            return res.status(403).json({ message: "Access denied. Not registered for this institute." });
        }

        // 3. Verify student's batch matches
        if (student.batch !== batch) {
            req.log.warn(
                { studentId: student.studentId, requestedBatch: batch, actualBatch: student.batch },
                "LMS: Batch mismatch"
            );
            return res.status(403).json({ message: "Access denied. Batch mismatch." });
        }

        // 4. Verify PAID payment for this institute + batch + current month
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

        // 5. Fetch active videos for this institute + batch
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
