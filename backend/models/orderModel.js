const { sql, dbConfig } = require("../dbConfig");

async function createOrder(orderData) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("customerId", sql.Int, orderData.customerId)
    .input("stallId", sql.Int, orderData.stallId)
    .input("totalAmount", sql.Decimal(10, 2), orderData.totalAmount)
    .input("paymentStatus", sql.VarChar(20), orderData.paymentStatus)
    .input("orderStatus", sql.VarChar(20), orderData.orderStatus).query(`
      INSERT INTO Orders (
        customerId,
        stallId,
        totalAmount,
        paymentStatus,
        orderStatus
      )
      OUTPUT INSERTED.*
      VALUES (
        @customerId,
        @stallId,
        @totalAmount,
        @paymentStatus,
        @orderStatus
      )
    `);

  return result.recordset[0];
}

module.exports = {
  createOrder,
};
