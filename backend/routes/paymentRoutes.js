const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");
const {
  verifyToken,
  requireRole,
} = require("../middlewares/authMiddleware");

// All payment routes require the user to be a logged-in vendor
router.use(
  verifyToken,
  requireRole("vendor")
);

// Get all rental payments for the logged-in vendor
router.get(
  "/",
  paymentController.list
);

// Mark a payment as paid
router.put(
  "/:id/pay",
  paymentController.pay
);

module.exports = router;