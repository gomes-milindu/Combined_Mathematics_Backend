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

const Video = mongoose.model("Video", videoSchema);
export default Video;
