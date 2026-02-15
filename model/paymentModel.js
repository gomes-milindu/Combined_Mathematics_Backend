import mongoose from "mongoose";

const paymentModel = new mongoose.Schema({

  studentId: {
    type: String,
    required: true,
  },

  batch: {
    type: String,
    required: true,
  },


  month: {
    type: String, // e.g. "2026-02"
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["PAID", "PENDING"],
    default: "PAID",
  },

  cardType:{
    type: String,
    default:"Full Payment"
  },

  paidDate: {
    type: Date,
  },

}, { timestamps: true });

// 🔥 IMPORTANT
paymentModel.index(
  { studentId: 1, batch: 1, month: 1 },
  { unique: true }
);

const Payment = mongoose.model("Payment", paymentModel);
export default Payment;
