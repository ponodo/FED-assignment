const express = require("express");
const stallController = require("../controllers/stallController");

const router = express.Router();

router.get("/", stallController.getAllStalls);

router.get("/:stallId/menu", stallController.getMenuByStallId);

module.exports = router;
