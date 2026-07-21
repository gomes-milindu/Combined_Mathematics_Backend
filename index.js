import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import pinoHttp from 'pino-http';
import logger from './utils/logger.js';
import { authenticate } from './middleware/authMiddleware.js';

// routes
import adminRouter from './router/adminRouter.js';
import paymentRoute from './router/paymentRouter.js';
import dashboardRoute from './router/dashboardRoute.js';
import pricingRoute from './router/pricingRouter.js';
import studentRoute from "./router/studentRouter.js";
import addCourseRoute from "./router/addCourse.js";

const app = express();

app.use(
  pinoHttp({
    logger,
    
    customStartMessage: false, 
    customSuccessMessage: false,
    customErrorMessage: false,
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl, "origin:", req.headers.origin);
  next();
});

app.use(authenticate);


app.get("/", (req, res) => {
  res.send("Combined Mathematics Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================================
   API ROUTES
========================================= */
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

if (!process.env.JWT_SECRET) {
  throw new Error("Missing env var: JWT_SECRET — required for authentication");
}

if (process.env.JWT_SECRET.length < 32) {
  logger.warn("JWT_SECRET is shorter than 32 characters — consider using a stronger secret");
}

mongoose.connect(connectionString)
  .then(() => {
    console.log("Connected to the database");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log("DB connection failed:", err.message);
  });