import mongoose from "mongoose";

const paymentModel = new mongoose.Schema({

  studentId: {
    type: String,
    required: true,
  },

  institute: {
    type: String,
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

// 🔥 IMPORTANT — CURRENT INDEX (LEGACY)
// This index does NOT include institute, which blocks multi-institute payments
// with the same batch name in the same month.
//
// FUTURE MIGRATION REQUIRED (Phase 2):
//   1. db.payments.dropIndex('studentId_1_batch_1_month_1')
//   2. db.payments.createIndex({ studentId: 1, institute: 1, batch: 1, month: 1 }, { unique: true })
//
// DO NOT change the line below until the manual migration is executed.
paymentModel.index(
  { studentId: 1, batch: 1, month: 1 },
  { unique: true }
);

const Payment = mongoose.model("Payment", paymentModel);
export default Payment;
