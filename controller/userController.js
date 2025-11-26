import User from "../model/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export function createUser(req, res){
    
    const user = new User({
        
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:req.body.password
        
});

    user.save().then(
        ()=>{
            res.json(
                {
                    "message": "user save successfully"
                }
            )
        }
    )

}


export async function loginUser(req,res){
    User.findOne(
        {
            email: req.body.email
        }
    ).then(
        (user)=>{
            // const excistingUser = bcrypt.compareSync(req.body.password,User.password)

            if(req.body.password == User.password){
                jwt.sign(
                    {
                        firstName: User.firstName,
                        lastName: User.body,
                        email: User.email,
                        
                    },'JWT-Token'
                )

                res.json(
                    {
                        "user": User,
                        "token": token
                    }
                )
            }
        }
    )
}
