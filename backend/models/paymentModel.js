const { sql, getPool } = require("../dbConfig");

async function getVendorPayments(userId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT
        rp.paymentId,
        rp.agreementId,
        rp.dueDate,
        rp.amount,
        rp.paymentDate,
        rp.paymentMethod,
        rp.status,
        s.stallName,
        ra.stallNumber
      FROM RentalPayments rp
      JOIN RentalAgreements ra
        ON ra.agreementId = rp.agreementId
      JOIN Stalls s
        ON s.stallId = ra.stallId
      WHERE s.ownerId = @userId
      ORDER BY
        CASE
          WHEN rp.status = 'Pending' THEN 0
          ELSE 1
        END,
        rp.dueDate;
    `);

  return result.recordset;
}

async function markPaid(paymentId, userId, method) {
  const pool = await getPool();

  const paymentMethod = method || "Online";

  const result = await pool
    .request()
    .input("paymentId", sql.Int, paymentId)
    .input("userId", sql.Int, userId)
    .input("method", sql.VarChar(30), paymentMethod)
    .query(`
      UPDATE rp
      SET
        status = 'Paid',
        paymentDate = CAST(GETDATE() AS DATE),
        paymentMethod = @method
      OUTPUT INSERTED.*
      FROM RentalPayments rp
      JOIN RentalAgreements ra
        ON ra.agreementId = rp.agreementId
      JOIN Stalls s
        ON s.stallId = ra.stallId
      WHERE rp.paymentId = @paymentId
        AND s.ownerId = @userId;
    `);

  return result.recordset[0];
}

module.exports = {
  getVendorPayments,
  markPaid,
};