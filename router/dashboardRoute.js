import express from 'express'
import { getDashboardStats } from '../controller/dashboardController.js';


const dashboardRoute = express.Router()


dashboardRoute.get("/", getDashboardStats);

export default dashboardRoute