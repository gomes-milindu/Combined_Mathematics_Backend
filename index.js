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

    console.error("❌ CORS blocked:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, 
};


app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


app.use(express.json());


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


app.use("/student", studentRoute);
app.use("/addcourse", addCourseRoute);
app.use("/admin", adminRouter);
app.use("/payment", paymentRoute);
app.use("/dashboard", dashboardRoute);


const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
  });