const orderModel = require("../models/orderModel");

async function createOrder(req, res) {
  try {
    const { customerId, stallId, totalAmount, paymentStatus, orderStatus } =
      req.body;

    const numericCustomerId = Number(customerId);
    const numericStallId = Number(stallId);
    const numericTotalAmount = Number(totalAmount);

    if (!Number.isInteger(numericCustomerId) || numericCustomerId <= 0) {
      return res.status(400).json({
        error: "A valid customerId is required",
      });
    }

    if (!Number.isInteger(numericStallId) || numericStallId <= 0) {
      return res.status(400).json({
        error: "A valid stallId is required",
      });
    }

    if (Number.isNaN(numericTotalAmount) || numericTotalAmount <= 0) {
      return res.status(400).json({
        error: "A valid totalAmount is required",
      });
    }

    const newOrder = await orderModel.createOrder({
      customerId: numericCustomerId,
      stallId: numericStallId,
      totalAmount: numericTotalAmount,
      paymentStatus: paymentStatus || "Paid",
      orderStatus: orderStatus || "Completed",
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      error: "Unable to create order",
      details: error.message,
    });
  }
}

module.exports = {
  createOrder,
};
