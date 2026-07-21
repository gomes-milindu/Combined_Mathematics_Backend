import express from 'express'

import  { createAdmin, getAllAdmins, loginAdmin } from '../controller/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
const adminRouter = express.Router();

// Public
adminRouter.post("/login", loginAdmin);

// Protected — Admin only
adminRouter.post("/", requireAuth, requireAdmin, createAdmin);
adminRouter.get("/all", requireAuth, requireAdmin, getAllAdmins);

export default adminRouter
