import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";
import sendSMS from "../utils/sendSms.js";
import dotenv from "dotenv";
import { isAdmin } from "./adminController.js";

dotenv.config();

export async function createPayment(req, res) {
  if(!isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
  try {
    const {
      studentId,
      batch,
      month,
      amount,
      // status,
      cardType,
    } = req.body;

    // 1️⃣ Basic validation
    if (!studentId || !batch || !month  || !cardType) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2️⃣ Always create as PENDING
    const payment = new Payment({
      studentId,
      batch,
      // class: className,
      month,
      amount,
      status: "PAID",
      cardType,
      paidDate: new Date(),
    });

    // 3️⃣ Save (Mongo handles duplicates)
    const savedPayment = await payment.save();
    

    const studentDet = await Student.findOne({ studentId });
   

    const message = `Combined Maths Class
Payment Received
${studentDet.firstName} ${studentDet.lastName}
LKR ${savedPayment.amount} ${savedPayment.cardType}
${savedPayment.month} - ${savedPayment.batch}
${savedPayment.status}
Thank you`;

    const smsResult = await sendSMS(studentDet.phone, message);
    console.log("SMS result:", smsResult);
    return res.status(201).json({
      message: "Payment created successfully",
      payment: savedPayment,
      sendSMS: {status: "success"},
    });
  } catch (err) {
    // 4️⃣ Duplicate month handling
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Payment already exists for this student, batch, and month",
      });
    }

    
    return res.status(500).json({
      message: "Error creating payment",
      error: err.message,
    });
  }
}

export async function getPayment(req, res) {
  if(!isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
  try {
    const { studentId } = req.query;

    const payment = await Payment.find({ studentId }).sort({ paidDate: -1 }).limit(6);

    if (!payment) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({
      message: "Error getting payment",
      error: err.message,
    });
  }
}
