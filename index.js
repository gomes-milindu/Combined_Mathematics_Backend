import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// routes
import studentRoute from "./router/studentRouter.js";
import addCourseRoute from "./router/addCourse.js";
import adminRouter from "./router/adminRouter.js";
import paymentRoute from "./router/paymentRouter.js";
import dashboardRoute from "./router/dashboardRoute.js";

const app = express();


const allowlist = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://combined-mathematics-frontend.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowlist.includes(origin)) return callback(null, true);

    if (/^https:\/\/.*\.vercel\.app$/.test(origin))
      return callback(null, true);

    console.error("CORS blocked:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, 
};


app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, next);
  }
  next();
});

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
                    },
                    console.log("Hello from middleware")
                    
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


app.get("/", (req, res) => {
  res.send("Combined Mathematics Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/cors-test", (req, res) => {
  res.json({
    ok: true,
    origin: req.headers.origin || "no-origin",
  });
});

app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl, "origin:", req.headers.origin);
  next();
});

app.use("/student", studentRoute);
app.use("/addcourse", addCourseRoute);
app.use("/admin", adminRouter);
app.use("/payment", paymentRoute);
app.use("/dashboard", dashboardRoute);


const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
  });

  app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});