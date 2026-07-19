const { sql, getPool } = require("../dbConfig");

async function getVendorAgreements(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT ra.agreementId, ra.stallId, s.stallName, s.hawkerCentre,
           ra.stallNumber, ra.monthlyRent, ra.stallSizeSqFt,
           ra.startDate, ra.endDate, ra.status, ra.createdAt,
           (SELECT COUNT(*) FROM RentalPayments rp WHERE rp.agreementId = ra.agreementId) AS paymentCount,
           (SELECT COUNT(*) FROM RentalPayments rp WHERE rp.agreementId = ra.agreementId AND rp.status = 'Pending') AS pendingPaymentCount
    FROM RentalAgreements ra
    INNER JOIN Stalls s ON s.stallId = ra.stallId
    WHERE s.ownerId = @userId
    ORDER BY ra.startDate DESC, ra.agreementId DESC;
  `);
  return result.recordset;
}

async function getAgreementById(agreementId, userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("agreementId", sql.Int, agreementId)
    .input("userId", sql.Int, userId).query(`
      SELECT ra.*, s.stallName, s.hawkerCentre
      FROM RentalAgreements ra
      INNER JOIN Stalls s ON s.stallId = ra.stallId
      WHERE ra.agreementId = @agreementId AND s.ownerId = @userId;
    `);
  return result.recordset[0];
}

async function getVendorStalls(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.Int, userId).query(`
    SELECT stallId, stallName, hawkerCentre, stallNumber
    FROM Stalls WHERE ownerId = @userId ORDER BY stallName;
  `);
  return result.recordset;
}

async function createAgreement(userId, data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const ownsStall = await new sql.Request(transaction)
      .input("stallId", sql.Int, data.stallId)
      .input("userId", sql.Int, userId)
      .query("SELECT stallId FROM Stalls WHERE stallId=@stallId AND ownerId=@userId");
    if (!ownsStall.recordset[0]) throw Object.assign(new Error("Stall not found or not owned by this vendor."), { status: 403 });

    const inserted = await new sql.Request(transaction)
      .input("stallId", sql.Int, data.stallId)
      .input("stallNumber", sql.VarChar(30), data.stallNumber)
      .input("monthlyRent", sql.Decimal(10, 2), data.monthlyRent)
      .input("stallSizeSqFt", sql.Int, data.stallSizeSqFt)
      .input("startDate", sql.Date, data.startDate)
      .input("endDate", sql.Date, data.endDate)
      .input("status", sql.VarChar(20), data.status).query(`
        INSERT INTO RentalAgreements(stallId, stallNumber, monthlyRent, stallSizeSqFt, startDate, endDate, status)
        OUTPUT INSERTED.*
        VALUES(@stallId,@stallNumber,@monthlyRent,@stallSizeSqFt,@startDate,@endDate,@status);
      `);

    const agreement = inserted.recordset[0];
    await new sql.Request(transaction)
      .input("agreementId", sql.Int, agreement.agreementId)
      .input("monthlyRent", sql.Decimal(10, 2), data.monthlyRent)
      .input("startDate", sql.Date, data.startDate)
      .input("endDate", sql.Date, data.endDate).query(`
        DECLARE @due DATE = @startDate;
        WHILE @due <= @endDate
        BEGIN
          INSERT INTO RentalPayments(agreementId, dueDate, amount, status)
          VALUES(@agreementId, @due, @monthlyRent, 'Pending');
          SET @due = DATEADD(MONTH, 1, @due);
        END;
      `);
    await transaction.commit();
    return agreement;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateAgreement(agreementId, userId, data) {
  const pool = await getPool();
  const result = await pool.request()
    .input("agreementId", sql.Int, agreementId)
    .input("userId", sql.Int, userId)
    .input("stallNumber", sql.VarChar(30), data.stallNumber)
    .input("monthlyRent", sql.Decimal(10,2), data.monthlyRent)
    .input("stallSizeSqFt", sql.Int, data.stallSizeSqFt)
    .input("startDate", sql.Date, data.startDate)
    .input("endDate", sql.Date, data.endDate)
    .input("status", sql.VarChar(20), data.status).query(`
      UPDATE ra SET stallNumber=@stallNumber, monthlyRent=@monthlyRent,
        stallSizeSqFt=@stallSizeSqFt, startDate=@startDate, endDate=@endDate,
        status=@status, updatedAt=GETDATE()
      OUTPUT INSERTED.*
      FROM RentalAgreements ra INNER JOIN Stalls s ON s.stallId=ra.stallId
      WHERE ra.agreementId=@agreementId AND s.ownerId=@userId;
    `);
  return result.recordset[0];
}

async function deleteAgreement(agreementId, userId) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const allowed = await new sql.Request(transaction)
      .input("agreementId", sql.Int, agreementId).input("userId", sql.Int, userId)
      .query(`SELECT ra.agreementId FROM RentalAgreements ra JOIN Stalls s ON s.stallId=ra.stallId WHERE ra.agreementId=@agreementId AND s.ownerId=@userId`);
    if (!allowed.recordset[0]) { await transaction.rollback(); return false; }
    await new sql.Request(transaction).input("agreementId", sql.Int, agreementId).query("DELETE FROM RentalPayments WHERE agreementId=@agreementId; DELETE FROM RentalAgreements WHERE agreementId=@agreementId;");
    await transaction.commit();
    return true;
  } catch (error) { await transaction.rollback(); throw error; }
}

module.exports = { getVendorAgreements, getAgreementById, getVendorStalls, createAgreement, updateAgreement, deleteAgreement };
