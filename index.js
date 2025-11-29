import express from 'express';
import mongoose from 'mongoose';
import User from "./model/student.js";
import userRoute from './router/srudentRouter.js';
import studentRoute from './router/srudentRouter.js';


const app = express();
app.use(express.json());
app.listen(8080, start);



function start() {
    console.log('Server started');
}

const connectionString = "mongodb+srv://user:1234@cluster0.bujo2ta.mongodb.net/?appName=Cluster0"
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
                console.log(token)
                jwt.verify(token, 
                    // add secret ,
                    
                
                    (err,decoded)=>{
                        if(decoded == null){
                            res.json(
                                {
                                    message: "invalid token"
                                }
                            )
                            return // methanin ehata run krwnna epa
                        }else{
                            console.log(decoded)
                            req.user = decoded
                        }
                    }
                 ) // token eka decrypt krnwa
        }

        next()
    }
)

app.use("/student",studentRoute)


