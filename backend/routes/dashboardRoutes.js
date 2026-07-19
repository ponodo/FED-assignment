const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const {
  verifyToken,
  requireRole,
} = require("../middlewares/authMiddleware");

router.get(
  "/vendor",
  verifyToken,
  requireRole("vendor"),
  dashboardController.vendor
);

router.get(
  "/nea",
  verifyToken,
  requireRole("nea_officer"),
  dashboardController.nea
);

module.exports = router;