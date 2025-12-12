import jwt from "jsonwebtoken"
import Student from "../model/studentModel.js";
import QRCode from 'qrcode'

export function isAdmin(req,res){
    if(req.body.role == null){
        return false
    }

    if(req.body.role != "admin"){
        return false
    }

    return true

}



export async function createStudent(req, res){
    
    if(!isAdmin(req)){
        res.json({
            "message":"you havent access to create accounts"
        })

        return
    }
    
    
    const student = new Student({
        
            studentId:req.body.studentId,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:req.body.password
        
    });

    const existingStudent = Student.findOne({email: req.body.email})

    if(existingStudent == null){
        res.json(
            {
                "message":"Student Already Excists"
            }
        )
        return
    }

    const qrText = student.studentId.toString();  
    // const qrCode = await QRCode.toString(qrText);

    const qrPath = `./qrcodes/${qrText}.png`

    await QRCode.toFile(qrPath, qrText);

    student.qrCode = qrPath

    await student.save().then(
        ()=>{
            res.json(
                {
                    "message":"student saved succesfully"
                }
            )
        }
    ).catch(
        ()=>{
            res.json(
                {
                    "message":"student not saved"
                }
            )
        }
    )

    

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
                const token = jwt.sign(
                    {
                        firstName: user.firstName,
                        lastName: user.body,
                        email: user.email,
                        
                    },'JWT-Token'
                )

                res.json(
                    {
                        "student": Student,
                        "token": token
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
