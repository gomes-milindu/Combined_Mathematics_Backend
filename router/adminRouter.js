import express from 'express'

import  { createAdmin, loginAdmin } from '../controller/adminController.js';
const adminRouter = express.Router();

adminRouter.post("/",createAdmin);
adminRouter.post("/login",loginAdmin);

export default adminRouter
