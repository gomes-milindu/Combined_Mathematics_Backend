import express from 'express'
import User from '../model/user.js';
import { createUser, loginUser } from '../controller/userController.js';


const userRoute = express.Router()


userRoute.post("/", createUser)
userRoute.post("/login", loginUser)

export default userRoute