import express from 'express'
import { createPricing, getAllPricing, updatePricing,getInstitutes,getBatchesByInstitute } from '../controller/pricingController.js'
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js'

const pricingRoute = express.Router()

// Protected — Authenticated users
pricingRoute.get("/", requireAuth, getAllPricing)

// Protected — Admin only
pricingRoute.post("/create", requireAuth, requireAdmin, createPricing)
pricingRoute.put("/update", requireAuth, requireAdmin, updatePricing)
//pricingRoute.delete("/delete", requireAuth, requireAdmin, deletePricing)

pricingRoute.get("/institutes", requireAuth, getInstitutes)
pricingRoute.get("/institutes/:institute/batches", requireAuth, getBatchesByInstitute)


export default pricingRoute