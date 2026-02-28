import express from 'express'
import { createPricing, getPricing } from '../controller/pricingController.js'


const pricingRoute = express.Router()

pricingRoute.post("/create", createPricing)
pricingRoute.get("/", getPricing)



export default pricingRoute