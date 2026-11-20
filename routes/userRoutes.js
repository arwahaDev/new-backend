const express = require("express");

const {
  registerUser,
  loginUser,
  createUser,
  getAllUsers,
  getPendingUsers,
  updateUser,
  deleteUser,
  getUserById,
  getUsersByTeamLead,
  logoutUser
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.post("/login", loginUser);
router.post("/register", registerUser);

// Admin Only Routes
router.post("/create", protect, authorize("admin"), createUser);

router.get("/pending", protect, authorize("admin"), getPendingUsers);
router.get("/", protect, authorize("admin"), getAllUsers);

router.get("/team-lead/:teamLeadId", protect, authorize("admin"), getUsersByTeamLead);
router.get("/:id", protect, authorize("admin"), getUserById);

router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

// Logout
router.post("/logout", protect, logoutUser);

module.exports = router;