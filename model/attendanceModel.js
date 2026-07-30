import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    institute: {
      type: String,
      required: true,
    },
    batch: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    scanTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "late"],
      default: "present",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Duplicate prevention — one attendance per student per institute per batch per day
attendanceSchema.index(
  { student: 1, institute: 1, batch: 1, date: 1 },
  { unique: true }
);

// Query performance indexes
attendanceSchema.index({ institute: 1, batch: 1, date: 1 });
attendanceSchema.index({ student: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
