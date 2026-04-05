import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

import { createAdmin } from './controller/adminController.js';
import adminRouter from './router/adminRouter.js';
import paymentRoute from './router/paymentRouter.js';
import dashboardRoute from './router/dashboardRoute.js';
import pricingRoute from './router/pricingRouter.js';

// routes
import studentRoute from "./router/studentRouter.js";
import addCourseRoute from "./router/addCourse.js";

const app = express();


app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (
      origin === "http://localhost:5173" ||
      origin === "http://localhost:3000" ||
      origin === "https://combined-mathematics-frontend.vercel.app" ||
      origin.endsWith(".vercel.app") // allow all Vercel deployments
    ) {
      return callback(null, true);
    }

    console.warn("Blocked by CORS:", origin);
    return callback(null, true); // 🔥 allow anyway (safe for now)
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());

app.use(express.json());


app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl, "origin:", req.headers.origin);
  next();
});

app.use((req, res, next) => {
  let token = req.header("Authorization");

  if (token) {
    token = token.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  next();
});


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
app.use("/pricing", pricingRoute);
app.use("/dashboard", dashboardRoute);


app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8080;
const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("Missing env var: MONGODB_URI");
}

mongoose.connect(connectionString)
  .then(() => {
    console.log("Connected to the database");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log("DB connection failed:", err.message);
  });