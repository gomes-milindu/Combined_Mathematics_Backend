import express from 'express'
import  {createPayment, getPayment } from '../controller/paymentController.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'

const paymentRoute = express.Router()

// Protected — Admin only
paymentRoute.post("/create", requireAuth, requireAdmin, createPayment)
paymentRoute.get("/", requireAuth, requireAdmin, getPayment)

export default paymentRoute