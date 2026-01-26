import mongoose from "mongoose";

const studentModel = new mongoose.Schema({
    
   // IDENTIFICATION
    studentId:{
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
    email:{
        type: String,
        required: true,
        unique: true
    },           
    phone: {
        type: String,
        required: true,
    },
    
    password:{
        type:String,
        required: true
    },
  
  // ENROLLMENT INFORMATION
  course: {
        type: [String],
        require: true,
        
    },          
  batch: {
        type: String,
        required: true,
        
    },    
    
  
  // STATUS
  qrCode: {
        type: String,
        required: true,
        unique: true
        
    },      
  isActive: {
        type: Boolean,
        required: true,
        
    },     
  
  // PERSONAL DETAILS (optional)
 
  dateOfBirth: {
        type: Date,
        required: true,
        
    },
  

    role:{
        type:String,
        default:"student"
    }
})

const Student  = mongoose.model("Student",studentModel);
export default Student;
