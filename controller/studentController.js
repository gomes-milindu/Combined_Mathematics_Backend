import Student from "../model/studentModel.js";
import QRCode from 'qrcode'
import supabase from "../config/supabase.js";
import { isAdmin } from "../controller/adminController.js";

export async function createStudent(req, res) {
  req.log.debug("--> createStudent controller hit");
  if (!isAdmin(req, res)) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({
      message: "Access denied. Admin privileges required."
    });
  }

  try {
    req.log.info({ user: req.user, body: req.body }, "Creating new studenthit try block");

    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      password,
      institute,
      batch,
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

    const student = new Student({
      studentId,
      firstName,
      lastName,
      email,
      phone,
      password,
      institute,
      batch,
      dateOfBirth,
      paymentType,
      isActive,
    });

    await student.save();

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
    req.log.info({ studentId, fileName }, ",generating QR code and uploading to Supabase");

    if (supabase) {
  const { error } = await supabase.storage
      .from("qr-codes")
      .upload(fileName, qrBuffer, {
        contentType: "image/png",
      });

    if (error) {
      req.log.error({ error }, "Supabase upload failed");
      console.error("SUPABASE ERROR:", error);
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(fileName);

    student.qrCode = data.publicUrl;

    await student.save();
    
  } else {
    console.warn("Supabase not configured, skipping QR upload");
    req.log.warn("Supabase not configured, skipping QR upload");
  }

    req.log.info({ studentId, qrCodeUrl: data.publicUrl }, "QR code uploaded and student record updated");
    return res.status(201).json({
      message: "Student saved successfully",
      student,
    });

  } catch (err) {
    console.error("STUDENT ERROR:", err);
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


export async function loginStudent(req, res) {
  req.log.debug("--> loginStudent controller hit");
  Student.findOne(
    {
      email: req.body.email
    }
  ).then(
    (user) => {
      
      // console.log(user)
      if (req.body.password == user.password) {
        
        req.log.info({ user: user.email }, "Student login successful");
        res.json(
          {
          
            "message": "login succesfull"
          }
        )
      }
    }
  )
}

export async function getStudent(req, res) {
  req.log.debug("--> getStudent controller hit");
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const total = await Student.countDocuments();
    const students = await Student.find().sort({ _id: -1 }).skip(skip).limit(limit);
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
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const student = await Student.findById(req.params.id);
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
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const id = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }
    req.log.info({ studentId: id }, "Student deleted successfully");
    res.json({
      message: "Student deleted successfully",
      deletedStudent,
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
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
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
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const id = req.params.id;
    const updateData = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });

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
  if(!isAdmin) {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const student = await Student.findById(req.params.id);

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




