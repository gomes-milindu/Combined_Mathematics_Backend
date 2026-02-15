import Payment from "../model/paymentModel.js";

export async function createPayment(req, res) {
  try {
    const {
      studentId,
      batch,
      month,
      amount,
      // status,
      cardType
    } = req.body;

    // 1️⃣ Basic validation
    if (!studentId || !batch || !month || !amount || !cardType) {
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
      status:"PAID",
      cardType,
      paidDate: new Date()
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
  try {
    const { studentId } = req.query;

    const payment = await Payment.find({ studentId });

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
