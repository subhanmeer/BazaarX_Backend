const User = require("../model/UserModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = {
  userVerification: async (req, res, next) => {
    try {
      // 1. Get token from cookies or Authorization header
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          status: false,
          message: "Authentication required" 
        });
      }

      // 2. Verify token
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, process.env.TOKEN_KEY, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      // 3. Find user and check if active
      const user = await User.findById(decoded.id).select('-password');
      if (!user || user.status !== 'active') {
        return res.status(403).json({ 
          status: false,
          message: "Account not active or invalid" 
        });
      }

      // 4. Attach user to request
      req.user = user;
      
      // 5. Continue to next middleware/route
      next();
      
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      
      // Specific error messages for different cases
      let message = "Authentication failed";
      if (error.name === 'TokenExpiredError') {
        message = "Session expired, please login again";
      } else if (error.name === 'JsonWebTokenError') {
        message = "Invalid token";
      }

      return res.status(401).json({ 
        status: false,
        message 
      });
    }
  },

  // Pakistan-specific role check middleware
  checkShariaCompliance: (req, res, next) => {
    if (!req.user?.isShariaCompliant) {
      return res.status(403).json({
        status: false,
        message: "This action requires Sharia-compliant account"
      });
    }
    next();
  }
};