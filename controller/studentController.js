import Student from "../model/studentModel.js";
import QRCode from 'qrcode'
import supabase from "../config/supabase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function createStudent(req, res) {
  req.log.debug("--> createStudent controller hit");

  try {
    req.log.info({ user: req.user, body: req.body }, "Creating new student hit try block");

    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      password,
      institute,
      batch,
      enrollments: rawEnrollments,
      dateOfBirth,
      paymentType = "Full Payment",
      isActive = true,
    } = req.body;

    if (!studentId || !email || !phone) {
      req.log.warn({ body: req.body }, "Student validation failed due to missing fields");
      return res.status(400).json({
        message: "Fill the Details",
      });
    }

    if (paymentType !== "Full Payment" && paymentType !== "Half Payment") {
      req.log.warn({ paymentType }, "Student creation blocked: Invalid Payment Type");
      return res.status(400).json({
        message: "Invalid Payment Type. Must be Full Payment or Half Payment",
      });
    }

    // Build enrollments: accept new format or auto-convert legacy format
    let enrollments;
    if (Array.isArray(rawEnrollments) && rawEnrollments.length > 0) {
      // NEW format: enrollments: [{ institute, batch }, ...]
      for (const enr of rawEnrollments) {
        if (!enr.institute || !enr.batch) {
          req.log.warn({ enrollments: rawEnrollments }, "Invalid enrollment entry");
          return res.status(400).json({
            message: "Each enrollment must have both institute and batch",
          });
        }
      }
      enrollments = rawEnrollments.map(e => ({ institute: e.institute, batch: e.batch }));
    } else if (institute && batch) {
      // LEGACY format: institute (string or array) + batch (string)
      const instArray = Array.isArray(institute) ? institute : [institute];
      enrollments = instArray.map(inst => ({ institute: inst, batch }));
    } else {
      req.log.warn({ body: req.body }, "Student creation blocked: No enrollment data provided");
      return res.status(400).json({
        message: "At least one enrollment (institute + batch) is required",
      });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      req.log.warn({ email }, "Student creation blocked: Email already exists");
      return res.status(400).json({
        message: "Student Email Already Exists",
      });
    }

    const existingId = await Student.findOne({ studentId });
    if (existingId) {
      req.log.warn({ studentId }, "Student creation blocked: Student ID already exists");
      return res.status(400).json({
        message: "Student ID already registered",
      });
    }

    // Hash password with bcrypt before saving
    let hashedPassword = password;
    if (password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || 10);
      hashedPassword = await bcrypt.hash(password, saltRounds);
      req.log.debug({ studentId }, "Student password hashed with bcrypt");
    }

    // Populate both new and legacy fields for backward compatibility
    const student = new Student({
      studentId,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      enrollments,
      // Legacy fields: populated from the first enrollment for backward compat
      institute: enrollments.map(e => e.institute),
      batch: enrollments[0].batch,
      dateOfBirth,
      paymentType,
      isActive,
    });

    await student.save();

    if (supabase) {
      try {
        const qrBuffer = await QRCode.toBuffer(student._id.toString(), {
          width: 500,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        const fileName = `${studentId}.png`;
        req.log.info({ studentId, fileName }, "Generating QR code and uploading to Supabase");

        const { error } = await supabase.storage
          .from("qr-codes")
          .upload(fileName, qrBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (error) {
          throw new Error(error.message);
        }

        const { data } = supabase.storage
          .from("qr-codes")
          .getPublicUrl(fileName);

        student.qrCode = data.publicUrl;
        await student.save();

        req.log.info({ studentId, qrCodeUrl: data.publicUrl }, "QR code uploaded and student record updated");
      } catch (qrErr) {
        // Student is already saved — a QR failure shouldn't fail the whole request.
        // It can be generated later via the regenerate-QR endpoint.
        req.log.error({ error: qrErr, studentId }, "QR generation/upload failed, continuing without QR");
      }
    } else {
      req.log.warn("Supabase not configured, skipping QR upload");
    }

    // Strip password from response
    const studentResponse = student.toObject();
    delete studentResponse.password;

    return res.status(201).json({
      message: "Student saved successfully",
      student: studentResponse,
    });

  } catch (err) {
    req.log.error({ error: err }, "Unhandled error inside createStudent controller");
    if (err.code === 11000) {
      req.log.warn({ user: req.user }, "Create student failed: Duplicate key error");
      return res.status(400).json({
        message: "Duplicate key error",
        error: err.message
      });
    }

    if (err.name === 'ValidationError') {
      req.log.warn({ user: req.user }, "Create student failed: Validation error");
      return res.status(400).json({
        message: "Validation Error",
        error: err.message
      });
    }

    req.log.error({ user: req.user, error: err }, "Unhandled error inside createStudent controller");
    return res.status(500).json({
      message: "Student not saved",
      error: err.message,
    });
  }
}


export async function regenerateQr(req, res) {
  req.log.debug("--> regenerateQr controller hit");

  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!supabase) {
      req.log.warn("Supabase not configured, cannot generate QR");
      return res.status(503).json({ message: "Supabase not configured" });
    }

    const qrBuffer = await QRCode.toBuffer(student._id.toString(), {
      width: 500,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const fileName = `${student.studentId}.png`;

    const { error } = await supabase.storage
      .from("qr-codes")
      .upload(fileName, qrBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      req.log.error({ error }, "Supabase upload failed");
      return res.status(500).json({ message: "QR upload failed", error: error.message });
    }

    const { data } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(fileName);

    student.qrCode = data.publicUrl;
    await student.save();

    req.log.info({ studentId: student.studentId, qrCodeUrl: data.publicUrl }, "QR code regenerated");

    return res.status(200).json({
      message: "QR code regenerated",
      qrCode: student.qrCode,
    });
  } catch (err) {
    req.log.error({ error: err }, "Unhandled error inside regenerateQr controller");
    return res.status(500).json({ message: "Failed to regenerate QR", error: err.message });
  }
}

export async function loginStudent(req, res) {
  req.log.debug("--> loginStudent controller hit");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.log.warn({ email }, "Student login failed: missing fields");
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const user = await Student.findOne({ email });

    if (!user) {
      req.log.warn({ email }, "Student login failed: user not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Gradual password migration: try bcrypt first, then plain-text fallback
    let isPasswordValid = false;

    try {
      // Attempt bcrypt comparison (works for hashed passwords)
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      // bcrypt.compare throws if the stored value is not a valid hash
      // This means it's a legacy plain-text password — handled below
      req.log.debug({ email }, "bcrypt.compare failed, checking legacy plain-text password");
    }

    if (!isPasswordValid) {
      // Fallback: check for legacy plain-text password match
      if (password === user.password) {
        isPasswordValid = true;

        // Auto-migrate: hash the plain-text password and update in DB
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || 10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await Student.updateOne({ _id: user._id }, { password: hashedPassword });
        req.log.info({ email }, "Legacy plain-text password auto-migrated to bcrypt");
      }
    }

    if (!isPasswordValid) {
      req.log.warn({ email }, "Student login failed: incorrect password");
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    // Issue JWT token
    if (!process.env.JWT_SECRET) {
      req.log.error("JWT_SECRET missing!");
      return res.status(500).json({
        success: false,
        message: "Server config error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    req.log.info({ email }, "Student login successful");
    return res.json({
      success: true,
      message: "login succesfull",
      token,
    });

  } catch (err) {
    req.log.error(err, "Unhandled error inside loginStudent controller");
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function getStudent(req, res) {
  req.log.debug("--> getStudent controller hit");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const total = await Student.countDocuments();
    const students = await Student.find().select("-password").sort({ _id: -1 }).skip(skip).limit(limit);
    req.log.info({ total, page, limit }, "Students retrieved successfully");
    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    // console.error(err);
    req.log.error(err, "Unhandled error inside getStudent controller");
    res.status(500).json({
      message: "Failed to retreive products",
    });
  }
}

export async function getOneStudent(req, res) {
  req.log.debug("--> getOneStudent controller hit");
  try {
    const student = await Student.findById(req.params.id).select("-password");
    res.json(student);
    req.log.info({ studentId: req.params.id }, "Student retrieved successfully");
  } catch (err) {
    // console.error(err);
    req.log.error(err, "Unhandled error inside getOneStudent controller");
    res.status(500).json({
      message: "Failed to retreive product",
    });
  }
}

export async function deleteStudent(req, res) {
  req.log.debug("--> deleteStudent controller hit");
  try {
    const id = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }
    req.log.info({ studentId: id }, "Student deleted successfully");
    // Strip password from response
    const safeStudent = deletedStudent.toObject();
    delete safeStudent.password;
    res.json({
      message: "Student deleted successfully",
      deletedStudent: safeStudent,
    });
  } catch (err) {
    // console.error(err);
    req.log.error(err, "Unhandled error inside deleteStudent controller");
    res.status(500).json({
      message: "Failed to delete student",
      error: err.message,
    });
  }
}



export default function scanQr(req, res) {
  req.log.debug("--> scanQr controller hit");
  const { studentId } = req.body;

  // console.log("Student id successfully got it.", studentId);
  req.log.info({ studentId }, "Student ID received from QR scan");
  return res.json({
    success: true,
    message: "Student ID received",
    studentId: studentId,
    timestamp: new Date()
  });
};

export async function editStudent(req, res) {
  req.log.debug("--> editStudent controller hit");
  try {
    const id = req.params.id;

    // Field allowlist — only permit known safe fields to be updated
    const allowedFields = [
      "studentId", "firstName", "lastName", "email", "phone",
      "institute", "batch", "enrollments", "dateOfBirth", "isActive", "paymentType",
    ];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

    if (!updatedStudent) {
      req.log.warn({ studentId: id }, "Edit student failed: Student not found");
      return res.status(404).json({
        message: "Student not found",
      });
    }
    req.log.info({ studentId: id }, "Student updated successfully");
    res.json({
      message: "Student updated successfully",
      updatedStudent,
    });
  } catch (err) {
    // console.error(err);
    req.log.error(err, "Unhandled error inside editStudent controller");
    res.status(500).json({
      message: "Failed to update student",
      error: err.message,
    });
  }
}

export async function getStudentById(req, res) {
  req.log.debug("--> getStudentById controller hit");
  try {
    // Ownership check: students can only view their own profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      req.log.warn({ requestedId: req.params.id, userId: req.user.id }, "IDOR attempt blocked");
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await Student.findById(req.params.id).select("-password");

    if (!student) {
      req.log.warn({ studentId: req.params.id }, "Get student failed: Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    req.log.info({ studentId: req.params.id }, "Student retrieved successfully");
    res.json(student);
  } catch (err) {
    req.log.error(err, "Unhandled error inside getStudentById controller");
    res.status(500).json({
      message: "Fetch failed",
      error: err.message,
    });
  }
}
