/**
 * BUG-01 Migration: Populate `month` field on legacy videos.
 *
 * Existing videos were created before the `month` field was added.
 * This script sets `month` to the YYYY-MM derived from the video's
 * `createdAt` timestamp as a best-effort fallback.
 *
 * Safety:
 * - Idempotent: never overwrites an existing month value.
 * - DRY-RUN by default: pass --execute to actually write to DB.
 * - Logs every change it would make / makes.
 *
 * Usage:
 *   DRY RUN (preview):   node scripts/migrate_video_month.js
 *   EXECUTE (write DB):  node scripts/migrate_video_month.js --execute
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const EXECUTE = process.argv.includes("--execute");

const videoSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Video = mongoose.model("VideoMigration", videoSchema, "videos");

async function run() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("ERROR: No MONGO_URI or MONGODB_URI found in .env");
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    console.log(EXECUTE ? "MODE: EXECUTE (will write to DB)" : "MODE: DRY RUN (preview only)");
    console.log("---");

    // Find all videos that are missing a month field
    const videos = await Video.find({
        $or: [
            { month: { $exists: false } },
            { month: null },
            { month: "" },
        ],
    }).lean();

    console.log(`Found ${videos.length} video(s) without a month field.`);

    if (videos.length === 0) {
        console.log("Nothing to migrate. Exiting.");
        await mongoose.disconnect();
        return;
    }

    let updated = 0;
    let skipped = 0;

    for (const video of videos) {
        const createdAt = video.createdAt;
        if (!createdAt) {
            console.log(`  SKIP: Video ${video._id} "${video.title}" has no createdAt — cannot infer month`);
            skipped++;
            continue;
        }

        const date = new Date(createdAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        console.log(`  ${EXECUTE ? "UPDATE" : "WOULD UPDATE"}: Video ${video._id} "${video.title}" → month: "${month}" (from createdAt: ${createdAt})`);

        if (EXECUTE) {
            await Video.updateOne(
                { _id: video._id },
                { $set: { month } }
            );
        }

        updated++;
    }

    console.log("---");
    console.log(`Summary: ${updated} updated, ${skipped} skipped, ${videos.length} total`);

    if (!EXECUTE && updated > 0) {
        console.log("\nThis was a DRY RUN. To apply changes, run:");
        console.log("  node scripts/migrate_video_month.js --execute");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
