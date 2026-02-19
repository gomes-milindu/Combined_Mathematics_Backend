import express from 'express'
import createCourse, { getCourse } from '../controller/addCourseController.js'

const addCourseRoute = express.Router()

addCourseRoute.post("/", createCourse)
addCourseRoute.get("/", getCourse)

export default addCourseRoute