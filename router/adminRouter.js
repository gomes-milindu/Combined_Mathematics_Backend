import express from 'express'

import  { createAdmin, getAllAdmins, loginAdmin } from '../controller/adminController.js';
const adminRouter = express.Router();

adminRouter.post("/",createAdmin);
adminRouter.post("/login",loginAdmin);
adminRouter.get("/all",getAllAdmins);

export default adminRouter
