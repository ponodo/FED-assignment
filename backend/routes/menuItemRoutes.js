const express = require("express");
const router = express.Router();

const menuItemController = require("../controllers/menuItemController");

// GET menu items by stall ID
router.get("/stall/:stallId", menuItemController.getMenuItemsByStallId);

// POST create new menu item
router.post("/", menuItemController.createMenuItem);

// PUT update menu item
router.put("/:menuItemId", menuItemController.updateMenuItem);

module.exports = router;