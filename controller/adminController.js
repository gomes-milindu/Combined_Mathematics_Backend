import AdminModel from "../model/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function createAdmin(req, res) {
  req.log.debug("--> createAdmin controller hit");
  try {
    const { name, userName, password, role } = req.body;

    if (!name || !userName || !password || !role) {
      req.log.warn({ body: req.body }, "Admin validation failed due to missing fields");
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const existingAdmin = await AdminModel.findOne({ userName });

    if (existingAdmin) {
      req.log.warn({ userName }, "Admin creation blocked: Username already exists");
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const admin = new AdminModel({
      name,
      userName,
      password: hashedPassword,
      role,
    });
    

    await admin.save();
    req.log.info({ adminId: admin._id }, "New admin successfully saved to database");
    return res.status(201).json({ message: "Admin Saved Successfully" });
  } catch (error) {
    req.log.error(error, "Unhandled error inside createAdmin controller");
    return res.status(500).json({ message: "Admin not Saved", error });
  }
}

export function isAdmin(req, res) {
  req.log.debug("--> isAdmin coontroller hit");
  if (!req.user || req.user.role !== "admin") {
    req.log.warn({ user: req.user }, "Access denied: User is not an admin");
    res.status(403).json({
      message: "Access denied. Admin only",
    });
    return false;
  }

  return true;
}

export async function loginAdmin(req, res) {
  req.log.debug("--> loginAdmin controller hit");
  try {
    // localStorage.removeItem("token");
    const { userName, password, role } = req.body;

    

    if (!userName || !password || !role) {
      req.log.warn({ body: req.body }, "Login validation failed due to missing fields");
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const user = await AdminModel.findOne({ userName });

    if (!user) {
      req.log.warn({ userName }, "Login failed: User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatching = bcrypt.compareSync(password, user.password);

    if (!isPasswordMatching) {
      req.log.warn({ userName }, "Login failed: Incorrect password");
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    if (!process.env.JWT_SECRET) {
      req.log.error("JWT_SECRET missing!");
      console.error("JWT_SECRET missing!");
      return res.status(500).json({
        success: false,
        message: "Server config error",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: 'admin',
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    req.log.info({ userName }, "Admin login successful");
    return res.json({
      success: true,
      message: "Login Successful",
      token,
    });

  } catch (err) {
    req.log.error(err, "Unhandled error inside loginAdmin controller");
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export async function getAllAdmins(req, res) {
  req.log.debug("--> getAllAdmins controller hit");
  try {
    const admins = await AdminModel.find();
    req.log.info({ count: admins.length }, "Admins retrieved successfully");
    return res.status(200).json(admins);
  } catch (error) {
    req.log.error(error, "Unhandled error inside getAllAdmins controller");

    return res.status(500).json({ message: "Error fetching admins", error });
  }
}
