import Course from "../model/addCourse.js";
import { isAdmin } from "./studentController.js";


export default function createCourse(req,res){
   if(isAdmin == false){
    res.json(
        {
            "message":"You cant create a course"
        }
    )
   }else{

        const courseData = req.body
        const newCourse = new Course(courseData)

        newCourse.save().then(
            ()=>{
                res.json(
                    {
                        "message":"Course saved succesfully"
                    }
                )
            }
        ).catch(
            ()=>{
                res.json(
                    {
                        "message":"Course not saved"
                    }
                )
            }
        )
   }
}