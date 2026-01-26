import AdminModel from "../model/adminModel.js";

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

    const admin = new AdminModel({ name, userName, password, role });

    await admin.save();

    return res.status(201).json({ message: "Admin Saved Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Admin not Saved", error });
  }
}

export function isAdmin(req, res) {
  if (req.body.role == null) {
    return false;
  }

  if (req.body.role != "admin") {
    return false;
  }

  return true;
}

export function loginAdmin(req, res) {
  console.log("Login Admin Working");
  if (req.body.role == "admin") {
    console.log("if working");
    AdminModel.findOne({ userName: req.body.userName }).then((user) => {
      console.log(user.password);
      if (req.body.password == user.password) {
        res.json({
          message: "Admin password Match",
        });
        
      }
      console.log("user is working");
    });
  }
}
