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

/* =========================
   ✅ SIMPLE & SAFE CORS (FINAL)
========================= */
app.use(cors({
  origin: "*", // allow all origins (fixes Vercel + Railway issues)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Handle preflight (OPTIONS)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

/* =========================
   Request Logger
========================= */
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl, "origin:", req.headers.origin);
  next();
});

/* =========================
   JWT Middleware
========================= */
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

/* =========================
   Basic Endpoints
========================= */
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

/* =========================
   Routes
========================= */
app.use("/student", studentRoute);
app.use("/addcourse", addCourseRoute);
app.use("/admin", adminRouter);
app.use("/payment", paymentRoute);
app.use("/pricing", pricingRoute);
app.use("/dashboard", dashboardRoute);

/* =========================
   Error Handler
========================= */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   Server + DB
========================= */
const PORT = process.env.PORT || 8080;
const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("Missing env var: MONGODB_URI");
}

mongoose.connect(connectionString)
  .then(() => {
    console.log("✅ Connected to the database");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log("❌ DB connection failed:", err.message);
  });