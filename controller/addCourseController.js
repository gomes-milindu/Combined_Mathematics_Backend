
import Course from "../model/coursesModel.js";
import crypto from "crypto";


export default async function createCourse(req, res) {
  try {
    const {
      courseName,
      courseCategory,
      coursePrice,
      courseUrl,
      courseDescription,
    } = req.body;

    // 1. Basic validation
    if (!courseName || !courseUrl || !coursePrice) {
      return res.status(400).json({
        message: "Fill the required Course Details",
      });
    }

    // 2. Check if course already exists
    const existingCourse = await Course.findOne({ courseUrl });
    if (existingCourse) {
      return res.status(409).json({
        message: "Course Already Exists",
      });
    }

    // 3. Create new course (auto courseId)
    const newCourse = new Course({
      courseId: crypto.randomUUID(), // auto unique id
      courseName,
      courseCategory,
      coursePrice,
      courseUrl,
      courseDescription,
    });

    // 4. Save to DB
    await newCourse.save();

    // 5. Success response
    return res.status(201).json({
      message: "Course saved successfully",
      course: newCourse,
    });

  } catch (err) {
    // REAL error logging
    console.error("Create course error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
}

export async function getCourse(req, res) {
  try {
    const course = await Course.find();
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to retreive products",
    });
  }
}
