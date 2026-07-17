const express = require("express");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me", verifyToken, authController.getProfile);
router.put("/me", verifyToken, authController.updateProfile);
router.delete("/me", verifyToken, authController.deleteAccount);

module.exports = router;
