import express from 'express'
import User from '../model/studentModel.js';
import scanQr, { createStudent,deleteStudent,editStudent,getOneStudent,getStudent,getStudentById,loginStudent} from '../controller/studentController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const studentRoute = express.Router()

// Public
studentRoute.post("/login", loginStudent)

// Protected — Admin only (specific paths MUST come before /:id param routes)
studentRoute.post("/", requireAuth, requireAdmin, createStudent)
studentRoute.get("/", requireAuth, requireAdmin, getStudent)
studentRoute.get("/scan", requireAuth, requireAdmin, scanQr)
studentRoute.get("/getOne/:id", requireAuth, requireAdmin, getOneStudent)

// Protected — Parameterized routes (must be LAST to avoid catching /scan, /getOne, etc.)
studentRoute.get("/:id", requireAuth, getStudentById);
studentRoute.put("/:id", requireAuth, requireAdmin, editStudent);
studentRoute.delete("/:id", requireAuth, requireAdmin, deleteStudent)

export default studentRoute