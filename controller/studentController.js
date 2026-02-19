import jwt from "jsonwebtoken"
import Student from "../model/studentModel.js";
import QRCode from 'qrcode'
import supabase from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";


export async function createStudent(req, res) {
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
      isActive,
    } = req.body;

    // Check required fields
    if (!studentId || !email) {
      return res.status(400).json({
        message: "Fill the Details",
      });
    }

    // Check if student already exists by EMAIL
    const existingStudentByEmail = await Student.findOne({ email });
    if (existingStudentByEmail) {
      return res.status(400).json({
        message: "Student with this Email Already Exists",
      });
    }

    // Check if student already exists by STUDENT ID
    const existingStudentById = await Student.findOne({ studentId });
    if (existingStudentById) {
      return res.status(400).json({
        message: "Student with this ID Already Exists",
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
    const qrBuffer = await QRCode.toBuffer(qrText);


    // const fileName = `qr-${uuidv4()}.png`;
    const fileName = `${studentId}.png`;


    const { error } = await supabase.storage
      .from("qr-codes")
      .upload(fileName, qrBuffer, {
        contentType: "image/png",
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
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
    console.error("REAL ERROR:", err);
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
      // const excistingUser = bcrypt.compareSync(req.body.password,User.password)
      console.log(user)
      if (req.body.password == user.password) {
        // const token = jwt.sign(
        //     {
        //         firstName: user.firstName,
        //         lastName: user.body,
        //         email: user.email,

        //     },'JWT-Token'
        // )

        res.json(
          {
            // "student": Student,
            // "token": token
            "message": "login succesfull"
          }
        )
      }
    }
  )
}

export async function getStudent(req, res) {

  try {
    const student = await Student.find();
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to retreive products",
    });
  }
}

export async function getOneStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to retreive product",
    });
  }
}

export async function deleteStudent(req, res) {
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
    console.error(err);
    res.status(500).json({
      message: "Failed to delete student",
      error: err.message,
    });
  }
}



export default function scanQr(req, res) {
  const { studentId } = req.body;

  console.log("Student id successfully got it.", studentId);

  return res.json({
    success: true,
    message: "Student ID received",
    studentId: studentId,
    timestamp: new Date()
  });
};

export async function editStudent(req, res) {
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
    console.error(err);
    res.status(500).json({
      message: "Failed to update student",
      error: err.message,
    });
  }
}

export async function getStudentById(req, res) {
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




