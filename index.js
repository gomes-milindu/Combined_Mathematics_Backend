import express from 'express';
import mongoose from 'mongoose';
import User from "./model/user.js";


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

app.post("/", (req, res) => {
    const user = new User({
        
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email:req.body.email,
            password:req.body.password
        
});

    user.save().then(
        ()=>{
            res.json(
                {
                    "message": "user save successfully"
                }
            )
        }
    )

})


