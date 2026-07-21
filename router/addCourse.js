import express from 'express'
import createCourse, { getCourse } from '../controller/addCourseController.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'

const addCourseRoute = express.Router()

// Public
addCourseRoute.get("/", getCourse)

// Protected — Admin only
addCourseRoute.post("/", requireAuth, requireAdmin, createCourse)

export default addCourseRoute