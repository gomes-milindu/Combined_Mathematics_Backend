import express from 'express'
import User from '../model/student.js';
import { createStudent,loginStudent} from '../controller/studentController.js';


const studentRoute = express.Router()


studentRoute.post("/", createStudent)
studentRoute.post("/login", loginStudent)

export default studentRoute