import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
   
    name:{
        type: String,
        require: true,
        
    },

    userName:{
        type: String,
        require: true,
        unique: true
    },

    password:{
        type:String,
        require: true,
        unique: true,
    },

    role:{
        type: String,
        require: true,
        default: "admin"
    }
})

const AdminModel = mongoose.model("Admin",adminSchema);
export default AdminModel;