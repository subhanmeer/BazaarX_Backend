const { Signup, Login } = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleware");
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const AuthController = require('../Controllers/AuthController');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15minutes
    max: 5,  // Limit each IP to 5 requests per window
    message: "too many attemps, please try again later"
});

router.post("/signup",authLimiter ,AuthController.Signup);
router.post("/login",authLimiter,AuthController.Login);
router.post("/", userVerification)

module.exports = router;