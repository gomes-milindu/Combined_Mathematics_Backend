import AdminModel from "../model/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function createAdmin(req, res) {
  try {
    const { name, userName, password, role } = req.body;

    if (!name || !userName || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const existingAdmin = await AdminModel.findOne({ userName });

    if (existingAdmin) {
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

    return res.status(201).json({ message: "Admin Saved Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Admin not Saved", error });
  }
}

export function isAdmin(req, res) {
  if (req.user.role == null) {
    return false;
  }

  if (req.user.role != "admin") {
    return false;
  }

  return true;
}

export async function loginAdmin(req, res) {
  try {
    const { userName, password, role } = req.body;

    // validation
    if (!userName || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide role, userName and password",
      });
    }

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid role",
      });
    }

    // find user
    const user = await AdminModel.findOne({ userName });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // compare password
    const isPasswordMatching = bcrypt.compareSync(password, user.password);

    if (!isPasswordMatching) {
      return res.status(400).json({
        success: false,
        message: "Password does not match",
      });
    }

    // check JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is missing in server",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login Successful",
      token,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
}

export async function getAllAdmins(req, res) {
  try {
    const admins = await AdminModel.find();
    return res.status(200).json(admins);
  } catch (error) {
    
    return res.status(500).json({ message: "Error fetching admins", error });
  }
}
