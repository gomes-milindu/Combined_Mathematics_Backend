import mongoose from "mongoose";

const studentModel = new mongoose.Schema({

    // IDENTIFICATION
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,

    },

    lastName: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        // required: true
    },

    // ENROLLMENT INFORMATION
    // NEW: Explicit institute+batch pairs for multi-enrollment support
    enrollments: [{
        institute: { type: String, required: true },
        batch: { type: String, required: true },
        _id: false,
    }],

    // LEGACY: Kept for backward compatibility with existing DB documents.
    // New registrations populate enrollments[] instead.
    // These will be removed after full migration.
    institute: {
        type: [String],
        default: undefined,

    },
    batch: {
        type: String,

    },


    // STATUS
    qrCode: {
        type: String,


    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },

    // PERSONAL DETAILS (optional)

    dateOfBirth: {
        type: Date,
        required: true,

    },


    role: {
        type: String,
        default: "student"
    },

    paymentType: {
        type: String,
        default: "Full Payment"
    }
})

const Student = mongoose.model("Student", studentModel);
export default Student;
