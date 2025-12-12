import express from 'express'
import User from '../model/studentModel.js';
import scanQr, { createStudent,getStudent,loginStudent} from '../controller/studentController.js';


const studentRoute = express.Router()


studentRoute.post("/", createStudent)
studentRoute.post("/login", loginStudent)
studentRoute.get("/", getStudent)
studentRoute.get("/scan", scanQr)

export default studentRoute