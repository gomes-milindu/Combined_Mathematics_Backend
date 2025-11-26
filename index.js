import express from 'express';
import mongoose from 'mongoose';


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
    console.log("this is a post request");
    res.json(
        {
            "message":"post request completed"
        }
    )
})


