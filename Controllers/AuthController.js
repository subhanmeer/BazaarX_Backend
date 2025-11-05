const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Pakistani phone regex (optional)
const phoneRegex = /^(\+92|0)[0-9]{10}$/;

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password, username, phone } = req.body;

    //Validations
    if (!email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    if (phone && !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Invalid Pakistani phone number" });
    }

    //Check existing user

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      username,
      phone,
      isShariaCompliant: req.body.isShariaCompliant || false, // Islamic finance flag
    });

    // Generate token
    const token = createSecretToken(user._id);

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true, // ✅ Prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // ✅ Secure only in production
      sameSite: "strict", // ✅ CSRF protection
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    // Response (never send password)
    res.status(201).json({
      message: "User signed in successfully",
      success: true,
      user: {
        email: user.email,
        username: user.username,
        phone: user.phone,
        isShariaCompliant: user.isShariaCompliant,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login user

module.exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" }); // Generic message
    }

    // Generate token
    const token = createSecretToken(user._id);

    // Set secure cookie
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
    });


     // Response
     res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
          email: user.email,
          username: user.username,
          isShariaCompliant: user.isShariaCompliant
        }
      });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};