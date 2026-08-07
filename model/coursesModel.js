import mongoose from "mongoose";

const courseModel = new mongoose .Schema({

    courseId:{
        type: String,
        required: true,
        unique: true
    },

    courseName: {
        type: String,
        required: true,
        unique: true
    },

    // Applied , Pure
    courseCategory: {
        type: String,
        required: true,
    },

    courseDescription: {
        type: String,
        required: true,
    },

    coursePrice: {
        type: String,
        required: true,
    },

    courseUrl:{
        type: String,
        required: true,
        unique: true
    }

})

const Course = mongoose.model("Course", courseModel)
export default Course;