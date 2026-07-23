const { sql, getPool } = require("../dbConfig");

async function getAllStalls() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      s.stallId,
      s.ownerId,
      s.stallName,
      s.cuisine,
      s.hawkerCentre,
      s.stallNumber,
      s.address,
      s.ownerName,
      s.phone,
      s.email,
      s.description,
      s.established,
      s.rating,
      s.totalReviews,
      s.deliveryAvailable,
      s.pickupAvailable,
      s.monday,
      s.tuesday,
      s.wednesday,
      s.thursday,
      s.friday,
      s.saturday,
      s.sunday,
      latestInspection.grade AS hygieneGrade,
      latestInspection.score AS hygieneScore,
      latestInspection.inspectionDate AS lastInspectionDate
    FROM Stalls s
    OUTER APPLY (
      SELECT TOP 1
        i.grade,
        i.score,
        i.inspectionDate
      FROM InspectionRecords i
      WHERE i.stallId = s.stallId
      ORDER BY
        i.inspectionDate DESC,
        i.inspectionId DESC
    ) AS latestInspection
    ORDER BY s.stallName;
  `);

  return result.recordset;
}

async function getStallById(stallId) {
  const pool = await getPool();

  const result = await pool.request().input("stallId", sql.Int, stallId).query(`
      SELECT
        s.stallId,
        s.ownerId,
        s.stallName,
        s.cuisine,
        s.hawkerCentre,
        s.stallNumber,
        s.address,
        s.ownerName,
        s.phone,
        s.email,
        s.description,
        s.established,
        s.rating,
        s.totalReviews,
        s.deliveryAvailable,
        s.pickupAvailable,
        s.monday,
        s.tuesday,
        s.wednesday,
        s.thursday,
        s.friday,
        s.saturday,
        s.sunday,
        latestInspection.grade AS hygieneGrade,
        latestInspection.score AS hygieneScore,
        latestInspection.inspectionDate AS lastInspectionDate
      FROM Stalls s
      OUTER APPLY (
        SELECT TOP 1
          i.grade,
          i.score,
          i.inspectionDate
        FROM InspectionRecords i
        WHERE i.stallId = s.stallId
        ORDER BY
          i.inspectionDate DESC,
          i.inspectionId DESC
      ) AS latestInspection
      WHERE s.stallId = @stallId;
    `);

  return result.recordset[0] || null;
}

async function getMenuByStallId(stallId) {
  const pool = await getPool();

  const result = await pool.request().input("stallId", sql.Int, stallId).query(`
      SELECT
        m.menuItemId,
        m.stallId,
        s.stallName,
        m.name,
        m.description,
        m.price,
        m.category,
        m.availability,
        m.prepTime,
        m.image
      FROM MenuItems m
      INNER JOIN Stalls s
        ON s.stallId = m.stallId
      WHERE m.stallId = @stallId
      ORDER BY m.menuItemId;
    `);

  return result.recordset;
}

module.exports = {
  getAllStalls,
  getStallById,
  getMenuByStallId,
};
