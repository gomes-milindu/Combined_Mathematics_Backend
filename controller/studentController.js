import Student from "../model/studentModel.js";
import QRCode from 'qrcode'
import supabase from "../config/supabase.js";
import { isAdmin } from "./adminController.js";




export async function createStudent(req, res) {
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
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
      isActive=true,
    } = req.body;

  
    // Check required fields
    if (!studentId || !email || !phone) {
      return res.status(400).json({
        message: "Fill the Details",
      });
    }


    // Check if student already exists by EMAIL
    const existingStudentByEmail = await Student.findOne({ email });
    if (existingStudentByEmail) {
      return res.status(400).json({
        message: "Student Email Already Exists",
      });
    }

    // Check if student already exists by STUDENT ID
    const existingStudentById = await Student.findOne({ studentId });
    if (existingStudentById) {
      return res.status(400).json({
        message: "Student ID already registered",
      });
    }

    // Create student instance (not saved yet)
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
      isActive,
    });
    

    const qrText = student._id.toString();
    const qrBuffer = await QRCode.toBuffer(qrText, {
    width: 500,        // size in pixels (default is ~116px)
    margin: 2,         // quiet zone margin (default is 4)
    errorCorrectionLevel: 'H',  // H = highest quality (L, M, Q, H)
    color: {
        dark: '#000000',   // QR dots color
        light: '#FFFFFF'   // background color
    }
});


    // const fileName = `qr-${uuidv4()}.png`;
    const fileName = `${studentId}.png`;


    const { error } = await supabase.storage
      .from("qr-codes")
      .upload(fileName, qrBuffer, {
        contentType: "image/png",
      });

    if (error) {
      // console.error("Supabase Upload Error:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }


    const { data: publicUrl } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(fileName);


    student.qrCode = publicUrl.publicUrl;


    await student.save();

    res.status(201).json({
      message: "Student saved successfully",
      student,
    });

  } catch (err) {
    // console.error("REAL ERROR:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate key error",
        error: err.message
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        error: err.message
      });
    }

    res.status(500).json({
      message: "Student not saved",
      error: err.message,
    });
  }
}


export async function loginStudent(req, res) {
  Student.findOne(
    {
      email: req.body.email
    }
  ).then(
    (user) => {
      
      // console.log(user)
      if (req.body.password == user.password) {
        

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
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const total = await Student.countDocuments();
    const students = await Student.find().sort({ _id: -1 }).skip(skip).limit(limit);
    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({
      message: "Failed to retreive products",
    });
  }
}

export async function getOneStudent(req, res) {
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const student = await Student.findById(req.params.id);
    res.json(student);
  } catch (err) {
    // console.error(err);
    res.status(500).json({
      message: "Failed to retreive product",
    });
  }
}

export async function deleteStudent(req, res) {
  if(!isAdmin) {
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

    res.json({
      message: "Student deleted successfully",
      deletedStudent,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({
      message: "Failed to delete student",
      error: err.message,
    });
  }
}



export default function scanQr(req, res) {
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  const { studentId } = req.body;

  // console.log("Student id successfully got it.", studentId);

  return res.json({
    success: true,
    message: "Student ID received",
    studentId: studentId,
    timestamp: new Date()
  });
};

export async function editStudent(req, res) {
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const id = req.params.id;
    const updateData = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }
    res.json({
      message: "Student updated successfully",
      updatedStudent,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({
      message: "Failed to update student",
      error: err.message,
    });
  }
}

export async function getStudentById(req, res) {
  if(!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({
      message: "Fetch failed",
      error: err.message,
    });
  }
}




