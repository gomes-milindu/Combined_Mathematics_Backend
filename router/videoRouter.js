import express from "express";
import { createVideo, getVideos, updateVideo, deleteVideo } from "../controller/videoController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const videoRoute = express.Router();

// Protected — Admin only
videoRoute.post("/", requireAuth, requireAdmin, createVideo);
videoRoute.get("/", requireAuth, requireAdmin, getVideos);
videoRoute.put("/:id", requireAuth, requireAdmin, updateVideo);
videoRoute.delete("/:id", requireAuth, requireAdmin, deleteVideo);

export default videoRoute;
