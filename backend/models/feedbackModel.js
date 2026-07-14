const { sql, dbConfig } = require("../dbConfig");

async function createFeedback(feedbackData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const result = await connection
      .request()
      .input("orderId", sql.Int, feedbackData.orderId)
      .input("customerId", sql.Int, feedbackData.customerId)
      .input("stallId", sql.Int, feedbackData.stallId)
      .input("rating", sql.Int, feedbackData.rating)
      .input("comments", sql.VarChar(1000), feedbackData.comments).query(`
        INSERT INTO Feedback (
          orderId,
          customerId,
          stallId,
          rating,
          comments
        )
        OUTPUT INSERTED.*
        VALUES (
          @orderId,
          @customerId,
          @stallId,
          @rating,
          @comments
        )
      `);

    return result.recordset[0];
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getFeedbackByStallId(stallId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const result = await connection.request().input("stallId", sql.Int, stallId)
      .query(`
        SELECT
          f.feedbackId,
          f.orderId,
          f.customerId,
          f.stallId,
          f.rating,
          f.comments,
          f.createdAt,
          f.updatedAt,
          c.customerName
        FROM Feedback f
        INNER JOIN Customers c
          ON f.customerId = c.customerId
        WHERE f.stallId = @stallId
        ORDER BY f.createdAt DESC
      `);

    return result.recordset;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getRatingSummary(stallId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().input("stallId", sql.Int, stallId)
    .query(`
      SELECT
        COALESCE(
          CAST(
            AVG(CAST(rating AS DECIMAL(10,2)))
            AS DECIMAL(10,2)
          ),
          0
        ) AS averageRating,

        COUNT(*) AS totalReviews,

        COALESCE(
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END),
          0
        ) AS fiveStar,

        COALESCE(
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END),
          0
        ) AS fourStar,

        COALESCE(
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END),
          0
        ) AS threeStar,

        COALESCE(
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END),
          0
        ) AS twoStar,

        COALESCE(
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END),
          0
        ) AS oneStar
      FROM Feedback
      WHERE stallId = @stallId
    `);

  return result.recordset[0];
}

async function updateFeedback(feedbackId, rating, comments) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const result = await connection
      .request()
      .input("feedbackId", sql.Int, feedbackId)
      .input("rating", sql.Int, rating)
      .input("comments", sql.VarChar(1000), comments).query(`
        UPDATE Feedback
        SET
          rating = @rating,
          comments = @comments,
          updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE feedbackId = @feedbackId
      `);

    return result.recordset[0] || null;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function deleteFeedback(feedbackId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const result = await connection
      .request()
      .input("feedbackId", sql.Int, feedbackId).query(`
        DELETE FROM Feedback
        OUTPUT DELETED.*
        WHERE feedbackId = @feedbackId
      `);

    return result.recordset[0] || null;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  createFeedback,
  getFeedbackByStallId,
  getRatingSummary,
  updateFeedback,
  deleteFeedback,
};
