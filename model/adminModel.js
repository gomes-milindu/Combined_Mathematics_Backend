import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
   
    name:{
        type: String,
        required: true,
        
    },

    userName:{
        type: String,
        required: true,
        unique: true
    },

    password:{
        type:String,
        required: true,
        unique: true,
    },

    role:{
        type: String,
        default: "admin"
    }
})

const AdminModel = mongoose.model("Admin",adminSchema);
export default AdminModel;