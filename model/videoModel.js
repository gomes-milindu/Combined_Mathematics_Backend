import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    // Billing month: the month this video's access is tied to.
    // Students must have a PAID payment for this month to view the video.
    // Format: "YYYY-MM" (e.g. "2026-08")
    month: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
        },
        message: (props) => `"${props.value}" is not a valid YYYY-MM month format`,
      },
    },
    // Legacy single-target fields (kept for backward compatibility with existing records)
    institute: {
      type: String,
      default: "",
    },
    batch: {
      type: String,
      default: "",
    },
    // Multi-target support: array of institute+batch pairs
    targets: [
      {
        institute: { type: String, required: true },
        batch: { type: String, required: true },
        _id: false,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

// Query performance indexes
videoSchema.index({ institute: 1, batch: 1, isActive: 1 });
videoSchema.index({ "targets.institute": 1, "targets.batch": 1, isActive: 1 });
videoSchema.index({ month: 1, isActive: 1 });

const Video = mongoose.model("Video", videoSchema);
export default Video;
