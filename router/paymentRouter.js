import express from 'express'
import  {createPayment, getPayment } from '../controller/paymentController.js'

const paymentRoute = express.Router()

paymentRoute.post("/create", createPayment)
paymentRoute.get("/", getPayment)


export default paymentRoute