import express from 'express'
import createPayment from '../controller/paymentController.js'
const paymentRoute = express.Router()

paymentRoute.post("/create", createPayment)


export default paymentRoute