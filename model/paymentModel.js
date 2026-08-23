import mongoose from "mongoose";

const paymentModel = new mongoose.Schema({

  studentId: {
    type: String,
    required: true,
  },

  institute: {
    type: String,
    required: true,
    default: "",
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
    type: String,
    required: true,
    default: "3800",
  },

  status: {
    type: String,
    enum: ["PAID", "PENDING", "Failed"],
    default: "PAID",
  },

  cardType: {
    type: String,
    default: "Full Payment"
  },

  paidDate: {
    type: Date,
  },

}, { timestamps: true });

// Unique payment identity: one payment per student per institute per batch per month
// Migration executed: old index (studentId, batch, month) has been dropped.
paymentModel.index(
  { studentId: 1, institute: 1, batch: 1, month: 1 },
  { unique: true }
);

const Payment = mongoose.model("Payment", paymentModel);
export default Payment;

