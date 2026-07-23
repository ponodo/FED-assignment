const { sql, dbConfig } = require("../dbConfig");

// =======================================
// Create Delivery
// =======================================
async function createDelivery(deliveryData) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("orderId", sql.Int, deliveryData.orderId)
    .input("riderId", sql.Int, deliveryData.riderId || null)
    .input("riderName", sql.VarChar(100), deliveryData.riderName || null)
    .input("riderPhone", sql.VarChar(20), deliveryData.riderPhone || null)
    .input("deliveryAddress", sql.VarChar(255), deliveryData.deliveryAddress)
    .input(
      "destinationLatitude",
      sql.Decimal(10, 7),
      deliveryData.destinationLatitude ?? null,
    )
    .input(
      "destinationLongitude",
      sql.Decimal(10, 7),
      deliveryData.destinationLongitude ?? null,
    )
    .input(
      "currentLatitude",
      sql.Decimal(10, 7),
      deliveryData.currentLatitude ?? null,
    )
    .input(
      "currentLongitude",
      sql.Decimal(10, 7),
      deliveryData.currentLongitude ?? null,
    )
    .input(
      "deliveryStatus",
      sql.VarChar(30),
      deliveryData.deliveryStatus || "Order Confirmed",
    )
    .input(
      "estimatedArrivalMinutes",
      sql.Int,
      deliveryData.estimatedArrivalMinutes ?? null,
    )
    .input(
      "remainingDistanceMetres",
      sql.Int,
      deliveryData.remainingDistanceMetres ?? null,
    ).query(`
      INSERT INTO Deliveries (
        orderId,
        riderId,
        riderName,
        riderPhone,
        deliveryAddress,
        destinationLatitude,
        destinationLongitude,
        currentLatitude,
        currentLongitude,
        deliveryStatus,
        estimatedArrivalMinutes,
        remainingDistanceMetres
      )
      OUTPUT INSERTED.*
      VALUES (
        @orderId,
        @riderId,
        @riderName,
        @riderPhone,
        @deliveryAddress,
        @destinationLatitude,
        @destinationLongitude,
        @currentLatitude,
        @currentLongitude,
        @deliveryStatus,
        @estimatedArrivalMinutes,
        @remainingDistanceMetres
      )
    `);

  return result.recordset[0];
}

// =======================================
// Get Delivery By Order ID
// =======================================
async function getDeliveryByOrderId(orderId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().input("orderId", sql.Int, orderId)
    .query(`
      SELECT *
      FROM Deliveries
      WHERE orderId = @orderId
    `);

  return result.recordset[0];
}

// =======================================
// Update Delivery Status
// =======================================
async function updateDeliveryStatus(deliveryId, deliveryStatus) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId)
    .input("deliveryStatus", sql.VarChar(30), deliveryStatus).query(`
      UPDATE Deliveries
      SET
        deliveryStatus = @deliveryStatus,
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE deliveryId = @deliveryId
    `);

  return result.recordset[0];
}

// =======================================
// Add Delivery Status History
// =======================================
async function addStatusHistory(deliveryId, deliveryStatus, changedByUserId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId)
    .input("deliveryStatus", sql.VarChar(30), deliveryStatus)
    .input("changedByUserId", sql.Int, changedByUserId || null).query(`
      INSERT INTO DeliveryStatusHistory (
        deliveryId,
        deliveryStatus,
        changedByUserId
      )
      OUTPUT INSERTED.*
      VALUES (
        @deliveryId,
        @deliveryStatus,
        @changedByUserId
      )
    `);

  return result.recordset[0];
}

// =======================================
// Get Delivery Status History
// =======================================
async function getStatusHistoryByDeliveryId(deliveryId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId).query(`
      SELECT *
      FROM DeliveryStatusHistory
      WHERE deliveryId = @deliveryId
      ORDER BY changedAt ASC
    `);

  return result.recordset;
}

// =======================================
// Update Rider Location
// =======================================
async function updateDeliveryLocation(
  deliveryId,
  currentLatitude,
  currentLongitude,
) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId)
    .input("currentLatitude", sql.Decimal(10, 7), currentLatitude)
    .input("currentLongitude", sql.Decimal(10, 7), currentLongitude).query(`
      UPDATE Deliveries
      SET
        currentLatitude = @currentLatitude,
        currentLongitude = @currentLongitude,
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE deliveryId = @deliveryId
    `);

  return result.recordset[0];
}

// =======================================
// Update ETA & Remaining Distance
// =======================================
async function updateDeliveryRouteDetails(
  deliveryId,
  estimatedArrivalMinutes,
  remainingDistanceMetres,
) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId)
    .input("estimatedArrivalMinutes", sql.Int, estimatedArrivalMinutes)
    .input("remainingDistanceMetres", sql.Int, remainingDistanceMetres).query(`
      UPDATE Deliveries
      SET
        estimatedArrivalMinutes = @estimatedArrivalMinutes,
        remainingDistanceMetres = @remainingDistanceMetres,
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE deliveryId = @deliveryId
    `);

  return result.recordset[0];
}

// =======================================
// Assign Rider
// =======================================
async function assignRider(deliveryId, riderId, riderName, riderPhone) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId)
    .input("riderId", sql.Int, riderId)
    .input("riderName", sql.VarChar(100), riderName)
    .input("riderPhone", sql.VarChar(20), riderPhone).query(`
      UPDATE Deliveries
      SET
        riderId = @riderId,
        riderName = @riderName,
        riderPhone = @riderPhone,
        deliveryStatus = 'Rider Assigned',
        assignedAt = GETDATE(),
        updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE deliveryId = @deliveryId
    `);

  return result.recordset[0];
}

// =======================================
// Delete Delivery Status History
// =======================================
async function deleteStatusHistoryByDeliveryId(deliveryId) {
  const connection = await sql.connect(dbConfig);

  await connection.request().input("deliveryId", sql.Int, deliveryId).query(`
      DELETE FROM DeliveryStatusHistory
      WHERE deliveryId = @deliveryId
    `);
}

// =======================================
// Delete Delivery
// =======================================
async function deleteDelivery(deliveryId) {
  const connection = await sql.connect(dbConfig);

  await deleteStatusHistoryByDeliveryId(deliveryId);

  const result = await connection
    .request()
    .input("deliveryId", sql.Int, deliveryId).query(`
      DELETE FROM Deliveries
      OUTPUT DELETED.*
      WHERE deliveryId = @deliveryId
    `);

  return result.recordset[0];
}

module.exports = {
  createDelivery,
  getDeliveryByOrderId,
  updateDeliveryStatus,
  addStatusHistory,
  getStatusHistoryByDeliveryId,
  updateDeliveryLocation,
  updateDeliveryRouteDetails,
  assignRider,
  deleteStatusHistoryByDeliveryId,
  deleteDelivery,
};
