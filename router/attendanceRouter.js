import express from "express";
import {
  markAttendance,
  getAttendance,
  getAttendanceStats,
  getStudentAttendance,
  deleteAttendance,
} from "../controller/attendanceController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const attendanceRoute = express.Router();

// Protected — Admin only
attendanceRoute.post("/mark", requireAuth, requireAdmin, markAttendance);
attendanceRoute.get("/", requireAuth, requireAdmin, getAttendance);
attendanceRoute.get("/stats", requireAuth, requireAdmin, getAttendanceStats);
attendanceRoute.delete("/:id", requireAuth, requireAdmin, deleteAttendance);

// Protected — Admin or Student (IDOR protection in controller)
attendanceRoute.get("/student/:studentId", requireAuth, getStudentAttendance);

export default attendanceRoute;
