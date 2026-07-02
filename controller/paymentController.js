import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";
import sendSMS from "../utils/sendSMS.js";
import dotenv from "dotenv";
import { isAdmin } from "./adminController.js";

dotenv.config();

export async function createPayment(req, res) {
  req.log.debug("--> createPayment controller hit");
  if(!isAdmin) {
      req.log.warn({ user: req.user }, "Access denied: User is not an admin");
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


    if (!studentId || !batch || !month || amount == undefined || !cardType) {
      req.log.warn({ user: req.user }, "Create payment failed: Missing required fields");
      return res.status(400).json({
        message: "All fields are required",
      });
    }

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
    req.log.info({ phone: studentDet.phone, smsResult }, "SMS Result");
    req.log.info({ paymentId: savedPayment._id }, "Payment created successfully");
    return res.status(201).json({
      message: "Payment created successfully",
      payment: savedPayment,
      sendSMS: {status: "success"},
    });
  } catch (err) {
    if (err.code === 11000) {
      req.log.warn({ user: req.user }, "Create payment failed: Duplicate payment entry");
      return res.status(409).json({
        message: "Payment already exists for this student, batch, and month",
      });
    }

    req.log.error(err, "Unhandled error inside createPayment controller");
    return res.status(500).json({
      message: "Error creating payment",
      error: err.message,
    });
  }
}

export async function getPayment(req, res) {
  req.log.debug("--> getPayment controller hit");
  if(!isAdmin) {
      req.log.warn({ user: req.user }, "Access denied: User is not an admin");
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
  try {
    const { studentId } = req.query;

    const payment = await Payment.find({ studentId }).sort({ paidDate: -1 }).limit(6);

    if (!payment) {
      req.log.warn({ user: req.user, studentId }, "Get payment failed: Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(payment);
    req.log.info({ studentId, count: payment.length }, "Payments retrieved successfully");
  } catch (err) {
    req.log.error(err, "Unhandled error inside getPayment controller");
    res.status(500).json({
      message: "Error getting payment",
      error: err.message,
    });
  }
}
