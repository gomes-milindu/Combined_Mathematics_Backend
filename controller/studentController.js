import jwt from "jsonwebtoken"
import Student from "../model/studentModel.js";
import QRCode from 'qrcode'
import { isAdmin } from "./adminController.js";





export async function createStudent(req, res){

    // if(!isAdmin(req)){
    //     return res.json({
    //         message: "you havent access to create accounts"
    //     })
    // }

    try {

        const existingStudent = await Student.findOne({ email: req.body.email })

        if(existingStudent){
            return res.json({
                message: "Student Already Exists"
            })
        }

        if(!req.body.studentId || !req.body.email){
            return res.json({
                message: "Fill the Details"
            })
        }

        const student = new Student({
            studentId: req.body.studentId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
            course: req.body.course,
            batch: req.body.batch,
            dateOfBirth: req.body.dateOfBirth,
            isActive: req.body.isActive,
        })

        const qrText = student.studentId.toString()
        const qrPath = `./qrcodes/${qrText}.png`

        await QRCode.toFile(qrPath, qrText)
        student.qrCode = qrPath

        await student.save()

        console.log("student saved")
        res.json({
            message: "student saved successfully"
        })

    } catch (err) {
        console.log("REAL ERROR 👉", err)
        res.status(500).json({
            message: "student not saved",
            error: err.message
        })
    }
}





export async function loginStudent(req,res){
    Student.findOne(
        {
            email: req.body.email
        }
    ).then(
        (user)=>{
            // const excistingUser = bcrypt.compareSync(req.body.password,User.password)
            console.log(user)
            if(req.body.password == user.password){
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
                        "message":"login succesfull"
                    }
                )
            }
        }
    )
}

export async function getStudent(req,res){
    
    try{
        const student = await Student.find();
        res.json(student);
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Failed to retreive products",
        });
    }
}

export async function getOneStudent(req,res){
    try{
        const student = await Student.findById(req.params.id);
        res.json(student);
    }catch(err){
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



export default function scanQr(req, res){
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



