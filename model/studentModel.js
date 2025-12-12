import mongoose from "mongoose";

const studentModel = new mongoose.Schema({
    
   // IDENTIFICATION
    studentId:{
        type: String,
        require: true,
        unique: true
    },        
    firstName: {
        type: String,
        require: true,
        
    },   
    
    lastName: {
        type: String,
        require: true,
        
    }, 
    email:{
        type: String,
        require: true,
        unique: true
    },           
    phone: {
        type: String,
        require: true,
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
        require: true,
        
    },    
    
  
  // STATUS
  qrCode: {
        type: String,
        require: true,
        unique: true
        
    },      
  isActive: {
        type: Boolean,
        require: true,
        
    },     
  
  // PERSONAL DETAILS (optional)
  address: {
        type: String,
        require: true,
        
    },
  dateOfBirth: {
        type: Date,
        require: true,
        
    },
  guardianContact: {
        type: String,
        require: true,
        
    },

    role:{
        type:String,
        default:"admin"
    }
})

const Student  = mongoose.model("Student",studentModel);
export default Student;
