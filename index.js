import express from 'express';
import mongoose from 'mongoose';
import studentRoute from './router/studentRouter.js';
import addCourseRoute from './router/addCourse.js';
import jwt from "jsonwebtoken";
import cors from "cors"
import {createAdmin} from './controller/adminController.js';
import adminRouter from './router/adminRouter.js';
import paymentRoute from './router/paymentRouter.js';
import dashboardRoute from './router/dashboardRoute.js';



const app = express();
app.use(cors())
app.use(express.json());

const PORT = process.env.PORT || 8080;
app.listen(PORT, start);



function start() {
    console.log(`Server started on port ${PORT}`);
}

const connectionString = process.env.MONGODB_URI;


mongoose.connect(connectionString).then(
    ()=>{
        console.log('Connected to the database');
    }
).catch(
    ()=>{
        console.log('Could not connect to the server');
    }
)

// app.use(
//     (req,res,next)=>{
//         let token = req.header("Authorization")

//         if(token != null)
//         {
//                 token = token.replace("Bearer ","")
//                 console.log(token)
//                 jwt.verify(token, 
//                     'JWT-Token' ,
                    
                
//                     (err,decoded)=>{
//                         if(decoded == null){
//                             res.json(
//                                 {
//                                     message: "invalid token"
//                                 }
//                             )
//                             return // methanin ehata run krwnna epa
//                         }else{
//                             console.log(decoded)
//                             req.user = decoded
//                         }
//                     }
                    
//                 ) // token eka decrypt krnwa

//                 next()
//         }else{
//             console.log(token)
//         }

        
//     }
// )

app.use("/student",studentRoute)
app.use("/addcourse",addCourseRoute)
app.use("/admin", adminRouter)
app.use("/payment", paymentRoute)
app.use("/dashboard", dashboardRoute)
// app.use(controller)

