const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModal"); // make sure the path matches
const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdminMiddleware");

const router = express.Router();


// ✅ Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    return res.status(201).json({
      message: "User registered successfully ✅",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful ✅",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  return res.json({ message: "Logged out" });
});


// ✅ Add user (Admin only)
router.post("/add-user", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    return res.status(201).json({
      message: "User added successfully ✅",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Add user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


// ✅ Check auth (Bearer token)
router.get("/check-auth", auth, (req, res) => {
  return res.json({ authenticated: true, user: req.user });
});


// ✅ Get all users (Admin only)
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get single user
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update user (self or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // if not admin, prevent updating role
    if (req.user.role !== "admin" && role) {
      return res
        .status(403)
        .json({ message: "Not authorized to change role" });
    }

    const updateData = { name, email };
    if (req.user.role === "admin" && role) updateData.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated ✅", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Delete user (Admin only, but cannot delete own account)
router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    // prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res
        .status(400)
        .json({ message: "❌ You cannot delete your own admin account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
