const menuItemModel = require("../models/menuItemModel");

// GET /stalls
async function getAllStalls(req, res) {
  try {
    const stalls = await menuItemModel.getAllStalls();

    return res.status(200).json(stalls);
  } catch (error) {
    console.error("Controller error in getAllStalls:", error);

    return res.status(500).json({
      message: "Error retrieving food stalls",
    });
  }
}

// GET /menuitems/:stallId
async function getMenuItemsByStallId(req, res) {
  try {
    const stallId = parseInt(req.params.stallId);

    if (isNaN(stallId) || stallId <= 0) {
      return res.status(400).json({
        message: "Invalid stall ID",
      });
    }

    const menuItems = await menuItemModel.getMenuItemsByStallId(stallId);

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error("Controller error in getMenuItemsByStallId:", error);

    return res.status(500).json({
      message: "Error retrieving menu items",
    });
  }
}

// POST /menuitems
async function createMenuItem(req, res) {
  try {
    const {
      stallId,
      stallName,
      name,
      category,
      description,
      price,
      prepTime,
      availability,
      image,
    } = req.body;

    if (!stallId || !stallName || !name || !price || !availability) {
      return res.status(400).json({
        message: "stallId, stallName, name, price, and availability are required",
      });
    }

    if (availability !== "Y" && availability !== "N") {
      return res.status(400).json({
        message: "Availability must be Y or N",
      });
    }

    const newMenuItem = await menuItemModel.createMenuItem({
      stallId,
      stallName,
      name,
      category,
      description,
      price,
      prepTime,
      availability,
      image,
    });

    return res.status(201).json({
      message: "Menu item created successfully",
      menuItem: newMenuItem,
    });
  } catch (error) {
    console.error("Controller error in createMenuItem:", error);

    return res.status(500).json({
      message: "Error creating menu item",
    });
  }
}

// PUT /menuitems/:menuItemId
async function updateMenuItem(req, res) {
  try {
    const menuItemId = parseInt(req.params.menuItemId);

    if (isNaN(menuItemId) || menuItemId <= 0) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

    const {
      name,
      category,
      description,
      price,
      prepTime,
      availability,
      image,
    } = req.body;

    if (!name || !price || !availability) {
      return res.status(400).json({
        message: "name, price, and availability are required",
      });
    }

    if (availability !== "Y" && availability !== "N") {
      return res.status(400).json({
        message: "Availability must be Y or N",
      });
    }

    const updatedMenuItem = await menuItemModel.updateMenuItem(menuItemId, {
      name,
      category,
      description,
      price,
      prepTime,
      availability,
      image,
    });

    if (!updatedMenuItem) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      message: "Menu item updated successfully",
      menuItem: updatedMenuItem,
    });
  } catch (error) {
    console.error("Controller error in updateMenuItem:", error);

    return res.status(500).json({
      message: "Error updating menu item",
    });
  }
}

module.exports = {
  getAllStalls,
  getMenuItemsByStallId,
  createMenuItem,
  updateMenuItem,
};