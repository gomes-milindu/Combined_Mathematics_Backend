
import Course from "../model/coursesModel.js";
import crypto from "crypto";


export default async function createCourse(req, res) {
  req.log.debug("--> createCourse controller hit");
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
      req.log.warn({ body: req.body }, "Course validation failed due to missing fields");
      return res.status(400).json({
        message: "Fill the required Course Details",
      });
    }

    // 2. Check if course already exists
    const existingCourse = await Course.findOne({ courseUrl });
    if (existingCourse) {
      req.log.warn({ courseUrl }, "Course creation blocked: URL already exists");
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

    req.log.info({ courseId: newCourse.courseId }, "New course successfully saved to database");
    // 5. Success response
    return res.status(201).json({
      message: "Course saved successfully",
      course: newCourse,
    });

  } catch (err) {
    // REAL error logging
    console.error("Create course error:", err);
    req.log.error(err, "Unhandled error inside createCourse controller");
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
}

export async function getCourse(req, res) {
  req.log.debug("--> getCourse controller hit");
  try {
    const courses = await Course.find();
    res.json(courses);
    req.log.info({ count: courses.length }, "Courses retrieved successfully");
  } catch (err) {
    req.log.error(err, "Unhandled error inside getCourse controller");
    res.status(500).json({
      message: "Failed to retrieve courses",
    });
  }
}

export async function updateCourse(req, res) {
  req.log.debug("--> updateCourse controller hit");
  try {
    const { id } = req.params;

    const allowedFields = [
      "courseName", "courseCategory", "coursePrice", "courseUrl", "courseDescription",
    ];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      req.log.warn({ id }, "Course not found for update");
      return res.status(404).json({ message: "Course not found" });
    }

    req.log.info({ courseId: updatedCourse.courseId }, "Course updated successfully");
    res.json({ message: "Course updated successfully", course: updatedCourse });
  } catch (err) {
    req.log.error(err, "Unhandled error inside updateCourse controller");
    res.status(500).json({ message: "Failed to update course", error: err.message });
  }
}

export async function deleteCourse(req, res) {
  req.log.debug("--> deleteCourse controller hit");
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      req.log.warn({ id }, "Course not found for delete");
      return res.status(404).json({ message: "Course not found" });
    }

    req.log.info({ courseId: deletedCourse.courseId }, "Course deleted successfully");
    res.json({ message: "Course deleted successfully", course: deletedCourse });
  } catch (err) {
    req.log.error(err, "Unhandled error inside deleteCourse controller");
    res.status(500).json({ message: "Failed to delete course", error: err.message });
  }
}
