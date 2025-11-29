import jwt from "jsonwebtoken"
import Student from "../model/student.js";
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
    User.findOne(
        {
            email: req.body.email
        }
    ).then(
        (user)=>{
            // const excistingUser = bcrypt.compareSync(req.body.password,User.password)

            if(req.body.password == Student.password){
                jwt.sign(
                    {
                        firstName: Student.firstName,
                        lastName: Student.body,
                        email: Student.email,
                        
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
