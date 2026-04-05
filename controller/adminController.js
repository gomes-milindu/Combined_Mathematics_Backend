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

    console.log("LOGIN BODY:", req.body); // debug

    if (!userName || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const user = await AdminModel.findOne({ userName });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatching = bcrypt.compareSync(password, user.password);

    if (!isPasswordMatching) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing!");
      return res.status(500).json({
        success: false,
        message: "Server config error",
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

  } catch (err) {
    console.error("LOGIN ERROR:", err); 
    return res.status(500).json({
      success: false,
      message: "Server error",
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
