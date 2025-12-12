import express from 'express'
import createCourse from '../controller/addCourseController.js'

const addCourseRoute = express.Router()

addCourseRoute.post("/", createCourse)

export default addCourseRoute