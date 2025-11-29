import jwt from "jsonwebtoken"
import Student from "../model/student.js";

export function createStudent(req, res){
    
    const student = new Student({
        
            studentId:req.body.studentId,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:req.body.password
        
});

    const existingStudent = Student.findOne({email: req.body.email})

    student.save().then(
        ()=>{
            res.json(
                {
                    "message": "user save successfully"
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
