const dashboardModel = require("../models/dashboardModel");

async function vendor(req, res, next) {
  try {
    const dashboardData = await dashboardModel.vendor(req.user.userId);
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
}

async function nea(req, res, next) {
  try {
    const dashboardData = await dashboardModel.nea();
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  vendor,
  nea,
};