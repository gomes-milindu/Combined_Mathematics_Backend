import express from 'express'
import { createPricing, getPricing } from '../controller/pricingController.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'

const pricingRoute = express.Router()

// Protected — Authenticated users
pricingRoute.get("/", requireAuth, getPricing)

// Protected — Admin only
pricingRoute.post("/create", requireAuth, requireAdmin, createPricing)

export default pricingRoute