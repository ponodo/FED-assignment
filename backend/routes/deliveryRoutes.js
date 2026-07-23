const express = require("express");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();

// Create a delivery
router.post("/", deliveryController.createDelivery);

// Get delivery by order ID
router.get("/order/:orderId", deliveryController.getDeliveryByOrderId);

// Update delivery status
router.put("/:deliveryId/status", deliveryController.updateDeliveryStatus);

// Update rider location
router.put("/:deliveryId/location", deliveryController.updateDeliveryLocation);

// Assign a rider
router.put("/:deliveryId/rider", deliveryController.assignRider);

// Delete a delivery
router.delete("/:deliveryId", deliveryController.deleteDelivery);

module.exports = router;
