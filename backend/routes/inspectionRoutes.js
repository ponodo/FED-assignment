const express = require("express");

const inspectionController = require("../controllers/inspectionController");

const {
    verifyToken,
    requireRole
} = require("../middlewares/authMiddleware");

const router = express.Router();

// =======================================
// Vendor Routes
// =======================================

// View inspection history for stalls owned by the logged-in vendor
router.get(
    "/vendor/history",
    verifyToken,
    requireRole("vendor"),
    inspectionController.vendorHistory
);

// =======================================
// Vendor and NEA Officer Routes
// =======================================

// View inspection history for a particular stall
router.get(
    "/stall/:stallId",
    verifyToken,
    requireRole("vendor", "nea_officer"),
    inspectionController.history
);

// =======================================
// NEA Officer Routes
// =======================================

// View stalls available for inspection
router.get(
    "/stalls",
    verifyToken,
    requireRole("nea_officer"),
    inspectionController.stalls
);

// View one inspection record
router.get(
    "/:id",
    verifyToken,
    requireRole("nea_officer"),
    inspectionController.getOne
);

// Create a new inspection record
router.post(
    "/",
    verifyToken,
    requireRole("nea_officer"),
    inspectionController.create
);

// Update an existing inspection record
router.put(
    "/:id",
    verifyToken,
    requireRole("nea_officer"),
    inspectionController.update
);

module.exports = router;