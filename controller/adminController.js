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
    console.log("Admin to be saved:", admin);

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

export function loginAdmin(req, res) {
  console.log("Login Admin Working");
  console.log(req.body);

  if (!req.body.role || !req.body.userName || !req.body.password) {
    return res.status(400).json({
      success: false,
      message: "Please provide role, userName and password",
    });
  }

  if (req.body.role == "admin") {
    AdminModel.findOne({ userName: req.body.userName }).then((user) => {
      const isPasswordMaching = bcrypt.compareSync(
        req.body.password,
        user.password,
      );

      if (isPasswordMaching) {
        const token = jwt.sign(
          {
            id: user._id,
            role: user.role,
          },
          "JWT-Token",
          { expiresIn: "1d" },
        );

        return res.json({
          success: true,
          message: "Login Successful",
          token: token,
        });

      } else {
        return res.status(400).json({
          success: false,
          password: "Admin password does not match",
        });
      }
      
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
