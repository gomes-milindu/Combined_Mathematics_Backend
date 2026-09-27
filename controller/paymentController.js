import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";
import sendSMS from "../utils/sendSMS.js";
import dotenv from "dotenv";

dotenv.config();

export async function createPayment(req, res) {
  req.log.debug("--> createPayment controller hit");
  try {
    const {
      studentId,
      institute,
      batch,
      month,
      amount,
      // status,
      cardType,
    } = req.body;


    if (!studentId || !institute || !batch || !month || amount == undefined || !cardType) {
      req.log.warn({ user: req.user }, "Create payment failed: Missing required fields");
      return res.status(400).json({
        message: "All fields are required (including institute)",
      });
    }

    // Verify the student exists and the institute+batch is in their enrollments
    const studentDet = await Student.findOne({ studentId });
    if (!studentDet) {
      req.log.warn({ studentId }, "Create payment failed: Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    // Check enrollments (new format) or legacy fields
    let isEnrolled = false;
    if (Array.isArray(studentDet.enrollments) && studentDet.enrollments.length > 0) {
      isEnrolled = studentDet.enrollments.some(
        (e) => e.institute === institute && e.batch === batch
      );
    } else {
      // Legacy fallback: check institute array + batch string
      const legacyInstitutes = Array.isArray(studentDet.institute)
        ? studentDet.institute
        : studentDet.institute ? [studentDet.institute] : [];
      const legacyBatch = studentDet.batch || "";
      isEnrolled = legacyInstitutes.includes(institute) && legacyBatch === batch;
    }

    if (!isEnrolled) {
      req.log.warn({ studentId, institute, batch }, "Create payment blocked: Student not enrolled in this institute+batch");
      return res.status(400).json({
        message: `Student is not enrolled in ${institute} / ${batch}`,
      });
    }

    // Duplicate check: studentId + institute + batch + month
    const existingPayment = await Payment.findOne({
      studentId,
      institute,
      batch,
      month,
    });
    if (existingPayment) {
      req.log.warn({ studentId, institute, batch, month }, "Create payment blocked: Duplicate payment");
      return res.status(409).json({
        message: "Payment already exists for this student, institute, batch, and month",
      });
    }

    const payment = new Payment({
      studentId,
      institute,
      batch,
      month,
      amount,
      status: "PAID",
      cardType,
      paidDate: new Date(),
    });

    const savedPayment = await payment.save();

    const message = `Combined Maths Class
                      Payment Received
                      ${studentDet.firstName} ${studentDet.lastName}
                      LKR ${savedPayment.amount} ${savedPayment.cardType}
                      ${savedPayment.institute} - ${savedPayment.batch}
                      ${savedPayment.month}
                      ${savedPayment.status}
                      Thank you`;

    const smsResult = await sendSMS(studentDet.phone, message);
    req.log.info({ phone: studentDet.phone, smsResult }, "SMS Result");
    req.log.info({ paymentId: savedPayment._id }, "Payment created successfully");
    return res.status(201).json({
      message: "Payment created successfully",
      payment: savedPayment,
      sendSMS: { status: "success" },
    });
  } catch (err) {
    if (err.code === 11000) {
      req.log.warn({ user: req.user }, "Create payment failed: Duplicate payment entry (DB index)");
      return res.status(409).json({
        message: "Payment already exists for this student, institute, batch, and month",
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
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';

    const payment = await Payment.find({ studentId }).sort({ paidDate: -1 });

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

