import express from 'express'
import User from '../model/studentModel.js';
import scanQr, { createStudent,deleteStudent,editStudent,getOneStudent,getStudent,getStudentById,loginStudent} from '../controller/studentController.js';


const studentRoute = express.Router()


studentRoute.post("/", createStudent)
studentRoute.post("/login", loginStudent)

studentRoute.get("/", getStudent)
studentRoute.get("/scan", scanQr)
studentRoute.delete("/:id", deleteStudent)
studentRoute.get("/getOne/:id", getOneStudent)
studentRoute.get("/:id", getStudentById);
studentRoute.put("/:id", editStudent);



export default studentRoute