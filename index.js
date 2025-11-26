import express from 'express';
import mongoose from 'mongoose';
import User from "./model/user.js";
import userRoute from './router/userRouter.js';


const app = express();
app.use(express.json());
app.listen(8080, start);



function start() {
    console.log('Server started');
}

const connectionString = "mongodb+srv://clone-2:1234@cluster0.arkyzdz.mongodb.net/?appName=Cluster0"
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
                jwt.verify(token,JWT_SECRET,
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

app.use("/user",userRoute)


