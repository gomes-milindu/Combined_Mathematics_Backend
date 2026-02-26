import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

// routes
import studentRoute from "./router/studentRouter.js";
import addCourseRoute from "./router/addCourse.js";
import adminRouter from "./router/adminRouter.js";
import paymentRoute from "./router/paymentRouter.js";
import dashboardRoute from "./router/dashboardRoute.js";

const app = express();

/*CORS*/
const allowlist = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://combined-mathematics-frontend.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowlist.includes(origin)) return callback(null, true);

    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

    console.error("CORS blocked:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));

app.use(express.json());

/*Request logger*/
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl, "origin:", req.headers.origin);
  next();
});

/*JWT middleware*/
app.use((req, res, next) => {
  let token = req.header("Authorization");

  if (token != null) {
    token = token.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ message: "invalid token" });
    }
  }

  next();
});

/*Basic endpoints */
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

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});


const PORT = process.env.PORT || 8080;

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("Missing env var: MONGODB_URI (set it in Railway → Variables)");
}

mongoose
  .connect(connectionString)
  .then(() => {
    console.log("Connected to the database");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Could not connect to the server");
    console.error(err);
    process.exit(1);
  });