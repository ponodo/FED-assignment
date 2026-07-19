const stallModel = require("../models/stallModel");

async function getAllStalls(req, res, next) {
  try {
    const stalls = await stallModel.getAllStalls();

    return res.status(200).json(stalls);
  } catch (error) {
    console.error("Get stalls error:", error);

    return res.status(500).json({
      error: "Unable to retrieve stalls",
      details: error.message,
    });
  }
}

async function getStallById(req, res, next) {
  try {
    const stallId = Number(req.params.stallId);

    if (!Number.isInteger(stallId) || stallId <= 0) {
      return res.status(400).json({
        error: "Invalid stall ID",
      });
    }

    const stall = await stallModel.getStallById(stallId);

    if (!stall) {
      return res.status(404).json({
        error: "Stall not found.",
      });
    }

    return res.status(200).json(stall);
  } catch (error) {
    console.error("Get stall error:", error);
    next(error);
  }
}

async function getMenuByStallId(req, res) {
  try {
    const stallId = Number(req.params.stallId);

    if (!Number.isInteger(stallId) || stallId <= 0) {
      return res.status(400).json({
        error: "Invalid stall ID",
      });
    }

    const menuItems = await stallModel.getMenuByStallId(stallId);

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error("Get menu error:", error);

    return res.status(500).json({
      error: "Unable to retrieve menu",
      details: error.message,
    });
  }
}

module.exports = {
  getAllStalls,
  getStallById,
  getMenuByStallId,
};
