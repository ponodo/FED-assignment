const { sql, getPool } = require("../dbConfig");

async function vendor(userId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM RentalAgreements ra
          JOIN Stalls s
            ON s.stallId = ra.stallId
          WHERE s.ownerId = @userId
        ) AS totalAgreements,

        (
          SELECT COUNT(*)
          FROM RentalAgreements ra
          JOIN Stalls s
            ON s.stallId = ra.stallId
          WHERE s.ownerId = @userId
            AND ra.status = 'Active'
        ) AS activeAgreements,

        (
          SELECT COUNT(*)
          FROM RentalPayments rp
          JOIN RentalAgreements ra
            ON ra.agreementId = rp.agreementId
          JOIN Stalls s
            ON s.stallId = ra.stallId
          WHERE s.ownerId = @userId
            AND rp.status = 'Pending'
        ) AS pendingPayments,

        (
          SELECT ISNULL(SUM(rp.amount), 0)
          FROM RentalPayments rp
          JOIN RentalAgreements ra
            ON ra.agreementId = rp.agreementId
          JOIN Stalls s
            ON s.stallId = ra.stallId
          WHERE s.ownerId = @userId
            AND rp.status = 'Pending'
        ) AS outstandingAmount;

      SELECT TOP 1
        i.grade AS currentGrade,
        i.score AS currentScore,
        i.inspectionDate AS latestInspectionDate,
        s.stallName
      FROM InspectionRecords i
      JOIN Stalls s
        ON s.stallId = i.stallId
      WHERE s.ownerId = @userId
      ORDER BY
        i.inspectionDate DESC,
        i.inspectionId DESC;
    `);

  const dashboardSummary = result.recordsets[0][0];
  const latestInspection = result.recordsets[1][0] || {};

  return {
    ...dashboardSummary,
    ...latestInspection,
  };
}

async function nea() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM Stalls
      ) AS totalStalls,

      (
        SELECT COUNT(*)
        FROM InspectionRecords
      ) AS totalInspections,

      (
        SELECT COUNT(*)
        FROM InspectionRecords
        WHERE inspectionDate >= DATEADD(
          DAY,
          -30,
          CAST(GETDATE() AS DATE)
        )
      ) AS inspectionsLast30Days;

    SELECT TOP 8
      i.inspectionId,
      s.stallName,
      s.hawkerCentre,
      i.inspectionDate,
      i.score,
      i.grade
    FROM InspectionRecords i
    JOIN Stalls s
      ON s.stallId = i.stallId
    ORDER BY
      i.inspectionDate DESC,
      i.inspectionId DESC;
  `);

  return {
    summary: result.recordsets[0][0],
    recent: result.recordsets[1],
  };
}

module.exports = {
  vendor,
  nea,
};