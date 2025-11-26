import mongoose from "mongoose";

const userModel = new mongoose.Schema({
    firstName:{
        type:String,
        require:true,

    },

    lastName:{
        type:String,
        require:true,
    },

    email:{
        type:String,
        require:true,
        unique:true,
    },

    password:{
        type:String,
        require:true,
    }
})

const User  = mongoose.model("User",userModel);
export default User;