import Video from "../model/videoModel.js";

/**
 * Admin — Create a new video (YouTube metadata) with multi-target support
 */
export async function createVideo(req, res) {
    req.log.debug("--> createVideo controller hit");
    try {
        const { title, videoUrl, institute, batch, description, targets } = req.body;

        if (!title || !videoUrl) {
            req.log.warn({ body: req.body }, "Create video failed: missing required fields");
            return res.status(400).json({ message: "Title and video URL are required" });
        }

        // Support both legacy single-target and new multi-target format
        let videoTargets = [];
        if (Array.isArray(targets) && targets.length > 0) {
            videoTargets = targets;
        } else if (institute && batch) {
            videoTargets = [{ institute, batch }];
        }

        if (videoTargets.length === 0) {
            return res.status(400).json({ message: "At least one institute + batch target is required" });
        }

        const video = new Video({
            title,
            description: description || "",
            videoUrl,
            // Keep legacy fields populated with first target for backward compat
            institute: videoTargets[0].institute,
            batch: videoTargets[0].batch,
            targets: videoTargets,
            createdBy: req.user?.id || null,
        });

        const saved = await video.save();
        req.log.info({ videoId: saved._id, targetCount: videoTargets.length }, "Video created successfully");
        return res.status(201).json({ message: "Video created successfully", video: saved });
    } catch (err) {
        req.log.error(err, "Unhandled error inside createVideo controller");
        return res.status(500).json({ message: "Error creating video", error: err.message });
    }
}

/**
 * Admin — List all videos
 */
export async function getVideos(req, res) {
    req.log.debug("--> getVideos controller hit");
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        req.log.info({ count: videos.length }, "Videos retrieved successfully");
        return res.json({ videos });
    } catch (err) {
        req.log.error(err, "Unhandled error inside getVideos controller");
        return res.status(500).json({ message: "Error fetching videos", error: err.message });
    }
}

/**
 * Admin — Update a video
 */
export async function updateVideo(req, res) {
    req.log.debug("--> updateVideo controller hit");
    try {
        const { id } = req.params;

        const allowedFields = ["title", "description", "videoUrl", "institute", "batch", "isActive", "targets"];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const updated = await Video.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            req.log.warn({ id }, "Video not found for update");
            return res.status(404).json({ message: "Video not found" });
        }

        req.log.info({ videoId: updated._id }, "Video updated successfully");
        return res.json({ message: "Video updated successfully", video: updated });
    } catch (err) {
        req.log.error(err, "Unhandled error inside updateVideo controller");
        return res.status(500).json({ message: "Error updating video", error: err.message });
    }
}

/**
 * Admin — Delete a video
 */
export async function deleteVideo(req, res) {
    req.log.debug("--> deleteVideo controller hit");
    try {
        const { id } = req.params;

        const deleted = await Video.findByIdAndDelete(id);

        if (!deleted) {
            req.log.warn({ id }, "Video not found for delete");
            return res.status(404).json({ message: "Video not found" });
        }

        req.log.info({ videoId: deleted._id }, "Video deleted successfully");
        return res.json({ message: "Video deleted successfully", video: deleted });
    } catch (err) {
        req.log.error(err, "Unhandled error inside deleteVideo controller");
        return res.status(500).json({ message: "Error deleting video", error: err.message });
    }
}
