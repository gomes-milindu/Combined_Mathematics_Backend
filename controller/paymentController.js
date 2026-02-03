import Payment from "../model/paymentModel.js";

export default async function createPayment(req, res) {
  try {
    const {
      studentId,
      courseId,
      class: className,
      month,
      amount,
    } = req.body;

    // 1️⃣ Basic validation
    if (!studentId || !courseId || !className || !month || !amount) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2️⃣ Always create as PENDING
    const payment = new Payment({
      studentId,
      courseId,
      class: className,
      month,
      amount,
      status: "PENDING",
      paidDate: null,
    });

    // 3️⃣ Save (Mongo handles duplicates)
    const savedPayment = await payment.save();

    return res.status(201).json({
      message: "Payment created successfully",
      payment: savedPayment,
    });

  } catch (err) {

    // 4️⃣ Duplicate month handling
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Payment already exists for this student, course, and month",
      });
    }

    return res.status(500).json({
      message: "Error creating payment",
      error: err.message,
    });
  }
}
