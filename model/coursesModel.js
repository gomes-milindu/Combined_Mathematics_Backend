import mongoose from "mongoose";

const courseModel = new mongoose .Schema({

    courseId:{
        type: String,
        require: true,
        unique: true
    },

    courseName: {
        type: String,
        require: true,
        unique: true
    },

    // Applied , Pure
    courseCategory: {
        type: String,
        require: true,
    },

    courseDescription: {
        type: String,
        require: true,
    },

    coursePrice: {
        type: String,
        require: true,
    },

    courseUrl:{
        type: String,
        require: true,
        unique: true
    }

})

const Course = mongoose.model("Course", courseModel)
export default Course;