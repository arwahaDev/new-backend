const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { fail } = require("../utils/response");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Not authorized. Token missing.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return fail(res, "User not found.", 401);
    }

    req.user = user;
    console.log("AUTH USER ID:", req.user.id);
    console.log("AUTH USER ROLE:", req.user.userType);

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return fail(res, "Not authorized. Invalid or expired token.", 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.userType;

    console.log("USER ROLE:", userRole);
    console.log("ALLOWED ROLES:", roles);

    if (!userRole || !roles.includes(userRole)) {
      return fail(res, "You do not have permission.", 403);
    }

    next();
  };
};

module.exports = { protect, authorize };