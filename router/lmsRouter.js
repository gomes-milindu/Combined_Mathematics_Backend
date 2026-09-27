import express from "express";
import { getStudentRegistrations, getVideosForCategory } from "../controller/lmsController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const lmsRoute = express.Router();

// Protected — Student only
lmsRoute.get("/registrations", requireAuth, requireRole("student"), getStudentRegistrations);
lmsRoute.get("/videos", requireAuth, requireRole("student"), getVideosForCategory);

export default lmsRoute;
