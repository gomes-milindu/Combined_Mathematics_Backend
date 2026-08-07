import express from 'express'
import createCourse, { getCourse, updateCourse, deleteCourse } from '../controller/addCourseController.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'

const addCourseRoute = express.Router()

// Public
addCourseRoute.get("/", getCourse)

// Protected — Admin only
addCourseRoute.post("/", requireAuth, requireAdmin, createCourse)
addCourseRoute.put("/:id", requireAuth, requireAdmin, updateCourse)
addCourseRoute.delete("/:id", requireAuth, requireAdmin, deleteCourse)

export default addCourseRoute