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
app.listen(8080, start);



function start() {
    console.log('Server started');
}

const connectionString = process.env.DATABASE_URL.replace("<db_password>", process.env.DB_PASSWORD)

mongoose.connect(connectionString).then(
    ()=>{
        console.log('Connected to the database');
    }
).catch(
    ()=>{
        console.log('Could not connect to the server');
    }
)

app.use(
    (req,res,next)=>{
        let token = req.header("Authorization")

        if(token != null)
        {
                token = token.replace("Bearer ","")
                
                jwt.verify(token, 
                    process.env.JWT_SECRET,
                    
                
                    (err,decoded)=>{
                        if(decoded == null){
                            res.json(
                                {
                                    message: "invalid token"
                                }
                            )
                            return // methanin ehata run krwnna epa
                        }else{
                            
                            req.user = decoded
                        }
                    }
                    
                ) // token eka decrypt krnwa

            
        }
        next()

        
    }
)

app.use("/student",studentRoute)
app.use("/addcourse",addCourseRoute)
app.use("/admin", adminRouter)
app.use("/payment", paymentRoute)
app.use("/dashboard", dashboardRoute)
// app.use(controller)

