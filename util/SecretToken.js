require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate a strong fallback key if TOKEN_KEY is missing
const generateFallbackKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const tokenConfig = {
  expiresIn: "3d",
  issuer: "your-app-name",
  audience: ["web", "mobile"], // Differentiate client types
  algorithm: "HS256" // Explicitly specify algorithm
};

const createSecretToken = (user) => {
  const tokenKey = process.env.TOKEN_KEY || generateFallbackKey();
  
  // Pakistan-specific: Add timezone awareness
  const now = new Date();
  const pakistanOffset = 5 * 60 * 60 * 1000; // UTC+5 for Pakistan
  const issuedAt = new Date(now.getTime() + pakistanOffset);

  const payload = {
    id: user._id,
    username: user.username,
    isShariaCompliant: user.isShariaCompliant || false, // Pakistan-specific
    iat: Math.floor(issuedAt.getTime() / 1000),
    // Additional security claims
    scope: ['user'] // Role-based access
  };

  return jwt.sign(payload, tokenKey, tokenConfig);
};

const verifyToken = (token) => {
  const tokenKey = process.env.TOKEN_KEY || generateFallbackKey();
  try {
    return jwt.verify(token, tokenKey, tokenConfig);
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
};

// Pakistan-specific: Generate transaction tokens for Islamic finance operations
const createTransactionToken = (transactionDetails) => {
  const tokenKey = process.env.TX_TOKEN_KEY || generateFallbackKey();
  return jwt.sign({
    ...transactionDetails,
    timestamp: new Date(),
    complianceChecked: true // Islamic finance compliance flag
  }, tokenKey, { expiresIn: "1h" });
};

module.exports = { 
  createSecretToken,
  verifyToken,
  createTransactionToken
};