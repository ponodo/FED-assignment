const { sql, dbConfig } = require("../dbConfig");

async function getAllStalls() {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().query(`
    SELECT
      stallId,
      stallName,
      cuisine,
      location
    FROM Stalls
    WHERE stallId IN (2, 3, 4, 5)
    ORDER BY stallName
  `);

  return result.recordset;
}

async function getMenuByStallId(stallId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().input("stallId", sql.Int, stallId)
    .query(`
      SELECT
        menuItemId,
        stallId,
        itemName,
        description,
        price,
        category,
        availability,
        prepTime,
        image
      FROM MenuItems
      WHERE stallId = @stallId
      ORDER BY menuItemId
    `);

  return result.recordset;
}

module.exports = {
  getAllStalls,
  getMenuByStallId,
};
