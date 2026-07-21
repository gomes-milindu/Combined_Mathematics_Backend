import express from 'express'
import { getDashboardStats } from '../controller/dashboardController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const dashboardRoute = express.Router()

// Protected — Admin only
dashboardRoute.get("/", requireAuth, requireAdmin, getDashboardStats);

export default dashboardRoute