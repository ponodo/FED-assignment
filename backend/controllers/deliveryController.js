const deliveryModel = require("../models/deliveryModel");
const googleRoutesService = require("../services/googleRoutesService");
const googleGeocodingService = require("../services/googleGeocodingService");
const allowedStatuses = [
  "Order Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Rider Assigned",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

// =======================================
// Create Delivery
// =======================================
async function createDelivery(req, res, next) {
  try {
    const { orderId, deliveryAddress, deliveryStatus } = req.body;

    if (!orderId || !deliveryAddress) {
      return res.status(400).json({
        message: "orderId and deliveryAddress are required.",
      });
    }

    if (deliveryStatus && !allowedStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        message: "Invalid delivery status.",
        allowedStatuses,
      });
    }

    // Convert the typed address into coordinates.
    const geocodedAddress =
      await googleGeocodingService.geocodeAddress(deliveryAddress);

    const delivery = await deliveryModel.createDelivery({
      ...req.body,

      // Store the cleaned address returned by Google.
      deliveryAddress: geocodedAddress.formattedAddress,

      destinationLatitude: geocodedAddress.latitude,

      destinationLongitude: geocodedAddress.longitude,
    });

    const statusHistory = await deliveryModel.addStatusHistory(
      delivery.deliveryId,
      delivery.deliveryStatus,
      req.body.changedByUserId || null,
    );

    return res.status(201).json({
      delivery,
      statusHistory,
      geocodedAddress,
    });
  } catch (error) {
    next(error);
  }
}

// =======================================
// Get Delivery By Order ID
// =======================================
async function getDeliveryByOrderId(req, res, next) {
  try {
    const orderId = parseInt(req.params.orderId, 10);

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const delivery = await deliveryModel.getDeliveryByOrderId(orderId);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    const statusHistory = await deliveryModel.getStatusHistoryByDeliveryId(
      delivery.deliveryId,
    );

    return res.json({
      delivery,
      statusHistory,
    });
  } catch (error) {
    next(error);
  }
}

// =======================================
// Update Delivery Status
// =======================================
async function updateDeliveryStatus(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.deliveryId, 10);
    const { deliveryStatus, changedByUserId } = req.body;

    if (!Number.isInteger(deliveryId)) {
      return res.status(400).json({
        message: "Invalid delivery ID.",
      });
    }

    if (!deliveryStatus) {
      return res.status(400).json({
        message: "deliveryStatus is required.",
      });
    }

    if (!allowedStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        message: "Invalid delivery status.",
        allowedStatuses,
      });
    }

    const delivery = await deliveryModel.updateDeliveryStatus(
      deliveryId,
      deliveryStatus,
    );

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    const statusHistory = await deliveryModel.addStatusHistory(
      deliveryId,
      deliveryStatus,
      changedByUserId || null,
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`delivery-${deliveryId}`).emit("deliveryStatusUpdated", {
        delivery,
        statusHistory,
      });
    }

    return res.json({
      delivery,
      statusHistory,
    });
  } catch (error) {
    next(error);
  }
}

// =======================================
// Update Rider Location And Recalculate ETA
// =======================================
async function updateDeliveryLocation(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.deliveryId, 10);
    const { currentLatitude, currentLongitude } = req.body;

    if (!Number.isInteger(deliveryId)) {
      return res.status(400).json({
        message: "Invalid delivery ID.",
      });
    }

    if (currentLatitude === undefined || currentLongitude === undefined) {
      return res.status(400).json({
        message: "currentLatitude and currentLongitude are required.",
      });
    }

    const latitude = Number(currentLatitude);
    const longitude = Number(currentLongitude);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: "Invalid currentLatitude.",
      });
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: "Invalid currentLongitude.",
      });
    }

    // First update the rider's current location.
    let delivery = await deliveryModel.updateDeliveryLocation(
      deliveryId,
      latitude,
      longitude,
    );

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    let routeDetails = null;
    let routeWarning = null;

    const destinationLatitude = Number(delivery.destinationLatitude);

    const destinationLongitude = Number(delivery.destinationLongitude);

    const hasValidDestination =
      !Number.isNaN(destinationLatitude) &&
      !Number.isNaN(destinationLongitude) &&
      destinationLatitude >= -90 &&
      destinationLatitude <= 90 &&
      destinationLongitude >= -180 &&
      destinationLongitude <= 180;

    if (hasValidDestination) {
      try {
        routeDetails = await googleRoutesService.getRouteDetails(
          latitude,
          longitude,
          destinationLatitude,
          destinationLongitude,
        );

        // Update ETA and distance in SQL.
        delivery = await deliveryModel.updateDeliveryRouteDetails(
          deliveryId,
          routeDetails.durationMinutes,
          routeDetails.distanceMeters,
        );
      } catch (routeError) {
        console.error(
          "Could not calculate delivery route:",
          routeError.response?.data || routeError.message,
        );

        routeWarning = "Location was updated, but ETA calculation failed.";
      }
    } else {
      routeWarning =
        "Location was updated, but the delivery has no valid destination coordinates.";
    }

    const responseData = {
      delivery,
      routeDetails,
    };

    if (routeWarning) {
      responseData.routeWarning = routeWarning;
    }

    const io = req.app.get("io");

    if (io) {
      io.to(`delivery-${deliveryId}`).emit(
        "deliveryLocationUpdated",
        responseData,
      );
    }

    return res.json(responseData);
  } catch (error) {
    next(error);
  }
}

// =======================================
// Assign Rider
// =======================================
async function assignRider(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.deliveryId, 10);

    const { riderId, riderName, riderPhone, changedByUserId } = req.body;

    if (!Number.isInteger(deliveryId)) {
      return res.status(400).json({
        message: "Invalid delivery ID.",
      });
    }

    if (!riderId || !riderName || !riderPhone) {
      return res.status(400).json({
        message: "riderId, riderName and riderPhone are required.",
      });
    }

    const delivery = await deliveryModel.assignRider(
      deliveryId,
      riderId,
      riderName,
      riderPhone,
    );

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    const statusHistory = await deliveryModel.addStatusHistory(
      deliveryId,
      "Rider Assigned",
      changedByUserId || null,
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`delivery-${deliveryId}`).emit("riderAssigned", {
        delivery,
        statusHistory,
      });
    }

    return res.json({
      delivery,
      statusHistory,
    });
  } catch (error) {
    next(error);
  }
}

// =======================================
// Delete Delivery
// =======================================
async function deleteDelivery(req, res, next) {
  try {
    const deliveryId = parseInt(req.params.deliveryId, 10);

    if (!Number.isInteger(deliveryId)) {
      return res.status(400).json({
        message: "Invalid delivery ID.",
      });
    }

    const delivery = await deliveryModel.deleteDelivery(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found.",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.to(`delivery-${deliveryId}`).emit("deliveryDeleted", {
        deliveryId,
      });
    }

    return res.json({
      message: "Delivery deleted successfully.",
      delivery,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDelivery,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  updateDeliveryLocation,
  assignRider,
  deleteDelivery,
};
