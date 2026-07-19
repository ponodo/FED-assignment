const { sql, getPool } = require("../dbConfig");

async function getAllStallsForOfficer() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT s.stallId, s.stallName, s.hawkerCentre, s.stallNumber, s.cuisine,
           latest.grade AS currentGrade, latest.score AS latestScore,
           latest.inspectionDate AS latestInspectionDate
    FROM Stalls s
    OUTER APPLY (
      SELECT TOP 1 i.grade, i.score, i.inspectionDate
      FROM InspectionRecords i
      WHERE i.stallId = s.stallId
      ORDER BY i.inspectionDate DESC, i.inspectionId DESC
    ) latest
    ORDER BY s.hawkerCentre, s.stallName;
  `);
  return result.recordset;
}

async function getHistoryForStall(stallId) {
  const pool = await getPool();
  const result = await pool.request().input("stallId", sql.Int, stallId).query(`
    SELECT i.inspectionId, i.stallId, s.stallName, s.hawkerCentre,
           i.officerId, CONCAT(u.firstName, ' ', u.lastName) AS officerName,
           i.inspectionDate, i.score, i.grade, i.remarks, i.createdAt, i.updatedAt
    FROM InspectionRecords i
    JOIN Stalls s ON s.stallId = i.stallId
    JOIN Users u ON u.userId = i.officerId
    WHERE i.stallId = @stallId
    ORDER BY i.inspectionDate DESC, i.inspectionId DESC;
  `);
  return result.recordset;
}

async function getVendorHistory(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT i.inspectionId, i.stallId, s.stallName, s.hawkerCentre,
           i.inspectionDate, i.score, i.grade, i.remarks,
           CONCAT(u.firstName, ' ', u.lastName) AS officerName
    FROM InspectionRecords i
    JOIN Stalls s ON s.stallId = i.stallId
    JOIN Users u ON u.userId = i.officerId
    WHERE s.ownerId = @userId
    ORDER BY i.inspectionDate DESC, i.inspectionId DESC;
  `);
  return result.recordset;
}

async function getById(inspectionId) {
  const pool = await getPool();
  const result = await pool.request().input("inspectionId", sql.Int, inspectionId).query(`
    SELECT i.*, s.stallName, s.hawkerCentre
    FROM InspectionRecords i JOIN Stalls s ON s.stallId=i.stallId
    WHERE i.inspectionId=@inspectionId;
  `);
  return result.recordset[0];
}

async function create(officerId, data) {
  const pool = await getPool();
  const result = await pool.request()
    .input("stallId", sql.Int, data.stallId)
    .input("officerId", sql.Int, officerId)
    .input("inspectionDate", sql.Date, data.inspectionDate)
    .input("score", sql.Int, data.score)
    .input("grade", sql.Char(1), data.grade)
    .input("remarks", sql.VarChar(1000), data.remarks || null).query(`
      INSERT INTO InspectionRecords(stallId, officerId, inspectionDate, score, grade, remarks)
      OUTPUT INSERTED.*
      VALUES(@stallId,@officerId,@inspectionDate,@score,@grade,@remarks);
    `);
  return result.recordset[0];
}

async function update(inspectionId, officerId, data) {
  const pool = await getPool();
  const result = await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .input("officerId", sql.Int, officerId)
    .input("inspectionDate", sql.Date, data.inspectionDate)
    .input("score", sql.Int, data.score)
    .input("grade", sql.Char(1), data.grade)
    .input("remarks", sql.VarChar(1000), data.remarks || null).query(`
      UPDATE InspectionRecords
      SET inspectionDate=@inspectionDate, score=@score, grade=@grade,
          remarks=@remarks, updatedAt=GETDATE()
      OUTPUT INSERTED.*
      WHERE inspectionId=@inspectionId;
    `);
  return result.recordset[0];
}

module.exports = { getAllStallsForOfficer, getHistoryForStall, getVendorHistory, getById, create, update };
