import Attendance from "../model/attendanceModel.js";
import Student from "../model/studentModel.js";

/**
 * POST /attendance/mark
 * Record attendance from QR scan.
 * Duplicate prevention via MongoDB unique index (atomic).
 */
export async function markAttendance(req, res) {
  req.log.debug("--> markAttendance controller hit");
  try {
    const { studentObjectId, institute, batch } = req.body;

    if (!studentObjectId || !institute || !batch) {
      return res.status(400).json({ message: "studentObjectId, institute, and batch are required." });
    }

    // 1. Find student
    const student = await Student.findById(studentObjectId);
    if (!student) {
      req.log.warn({ studentObjectId }, "Attendance: student not found");
      return res.status(404).json({ message: "Student not found." });
    }

    // 2. Block inactive students
    if (!student.isActive) {
      req.log.warn({ studentId: student.studentId }, "Attendance blocked: student inactive");
      return res.status(403).json({ message: "Student is inactive. Attendance cannot be recorded." });
    }

    // 3. Build today's date string
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // 4. Attempt insert (unique index handles duplicates atomically)
    const record = new Attendance({
      student: student._id,
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      institute,
      batch,
      date: today,
      scanTime: new Date(),
      status: "present",
      markedBy: req.user?.id || null,
    });

    await record.save();

    req.log.info({ studentId: student.studentId, institute, batch, date: today }, "Attendance recorded");
    return res.status(201).json({
      message: "Attendance recorded successfully.",
      attendance: record,
      studentName: `${student.firstName} ${student.lastName}`,
    });
  } catch (err) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      req.log.info({ body: req.body }, "Duplicate attendance blocked by index");
      return res.status(409).json({ message: "Attendance already recorded for this student today." });
    }
    req.log.error(err, "Unhandled error in markAttendance");
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
}

/**
 * GET /attendance/
 * List attendance records with filters.
 * Query: ?institute=X&batch=Y&date=YYYY-MM-DD&page=1&limit=20
 */
export async function getAttendance(req, res) {
  req.log.debug("--> getAttendance controller hit");
  try {
    const { institute, batch, date, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (institute) filter.institute = institute;
    if (batch) filter.batch = batch;
    if (date) filter.date = date;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ scanTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
    ]);

    return res.json({
      records,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    req.log.error(err, "Unhandled error in getAttendance");
    return res.status(500).json({ message: "Failed to retrieve attendance records." });
  }
}

/**
 * GET /attendance/stats
 * Dashboard stats for a specific class+date.
 * Query: ?institute=X&batch=Y&date=YYYY-MM-DD
 */
export async function getAttendanceStats(req, res) {
  req.log.debug("--> getAttendanceStats controller hit");
  try {
    const { institute, batch, date } = req.query;

    if (!institute || !batch || !date) {
      return res.status(400).json({ message: "institute, batch, and date are required." });
    }

    // Count present students
    const presentCount = await Attendance.countDocuments({ institute, batch, date });

    // Count total students enrolled in this institute+batch
    const totalStudents = await Student.countDocuments({
      institute: institute,
      batch: batch,
      isActive: true,
    });

    const absentCount = Math.max(0, totalStudents - presentCount);
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return res.json({
      institute,
      batch,
      date,
      presentCount,
      absentCount,
      totalStudents,
      percentage,
    });
  } catch (err) {
    req.log.error(err, "Unhandled error in getAttendanceStats");
    return res.status(500).json({ message: "Failed to retrieve attendance stats." });
  }
}

/**
 * GET /attendance/student/:studentId
 * Student's own attendance history.
 * Query: ?month=YYYY-MM (optional)
 */
export async function getStudentAttendance(req, res) {
  req.log.debug("--> getStudentAttendance controller hit");
  try {
    const { studentId } = req.params;
    const { month } = req.query;

    // IDOR protection: students can only view their own attendance
    if (req.user?.role === "student" && req.user?.id !== studentId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const filter = { student: studentId };

    if (month) {
      // month = "2026-08" → match dates starting with "2026-08"
      filter.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    const totalClasses = records.length;
    const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    return res.json({
      records,
      totalClasses,
      presentCount,
      percentage,
    });
  } catch (err) {
    req.log.error(err, "Unhandled error in getStudentAttendance");
    return res.status(500).json({ message: "Failed to retrieve student attendance." });
  }
}

/**
 * DELETE /attendance/:id
 * Remove erroneous attendance record.
 */
export async function deleteAttendance(req, res) {
  req.log.debug("--> deleteAttendance controller hit");
  try {
    const { id } = req.params;

    const deleted = await Attendance.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    req.log.info({ id, studentId: deleted.studentId }, "Attendance record deleted");
    return res.json({ message: "Attendance record deleted.", attendance: deleted });
  } catch (err) {
    req.log.error(err, "Unhandled error in deleteAttendance");
    return res.status(500).json({ message: "Failed to delete attendance record." });
  }
}
