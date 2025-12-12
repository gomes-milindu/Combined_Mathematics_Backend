import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
    {
        
        courseId:{
            type: String,
            required: true,
            unique: true
        },
        
        
        courseName:{
            type: String,
            required: true,
            unique: true
        },

        // pure mAths /  applied maths
        courseType:{
            type: String,
            required: true
        },

        courseDescription:{
            type:String,
            required: true
        },

        price:{
            type: Number,
            required: true
        },

        thumbnail:{
            type: String,
            required: true,
            default: " "
        }




    }
)


const Course = mongoose.model("Course", courseSchema)

export default Course;