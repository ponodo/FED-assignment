const { sql, getPool } = require("../dbConfig");

// GET all stalls
async function getAllStalls() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      s.stallId,
      s.stallName,
      s.cuisine,
      s.hawkerCentre,
      s.address,
      s.rating,
      s.totalReviews,
      s.deliveryAvailable,
      s.pickupAvailable,
      latestInspection.grade AS hygieneGrade
    FROM Stalls s
    OUTER APPLY (
      SELECT TOP 1
        i.grade
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

// GET menu items by stall ID
async function getMenuItemsByStallId(stallId) {
  const pool = await getPool();

  const result = await pool.request().input("stallId", sql.Int, stallId).query(`
      SELECT
        m.menuItemId,
        m.stallId,
        s.stallName,
        m.name,
        m.category,
        m.description,
        m.price,
        m.prepTime,
        m.availability,
        m.image
      FROM MenuItems m
      INNER JOIN Stalls s
        ON s.stallId = m.stallId
      WHERE m.stallId = @stallId
      ORDER BY m.menuItemId;
    `);

  return result.recordset;
}

// POST create menu item
async function createMenuItem(menuItemData) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("stallId", sql.Int, menuItemData.stallId)
    .input("name", sql.VarChar(100), menuItemData.name)
    .input("category", sql.VarChar(50), menuItemData.category || null)
    .input("description", sql.VarChar(500), menuItemData.description || null)
    .input("price", sql.Decimal(10, 2), menuItemData.price)
    .input("prepTime", sql.Int, menuItemData.prepTime || null)
    .input("availability", sql.Char(1), menuItemData.availability || "Y")
    .input("image", sql.VarChar(255), menuItemData.image || null).query(`
      INSERT INTO MenuItems (
        stallId,
        name,
        category,
        description,
        price,
        prepTime,
        availability,
        image
      )
      OUTPUT INSERTED.menuItemId
      VALUES (
        @stallId,
        @name,
        @category,
        @description,
        @price,
        @prepTime,
        @availability,
        @image
      );
    `);

  const newMenuItemId = result.recordset[0].menuItemId;

  return getMenuItemById(newMenuItemId);
}

// GET one menu item by ID
async function getMenuItemById(menuItemId) {
  const pool = await getPool();

  const result = await pool.request().input("menuItemId", sql.Int, menuItemId)
    .query(`
      SELECT
        m.menuItemId,
        m.stallId,
        s.stallName,
        m.name,
        m.category,
        m.description,
        m.price,
        m.prepTime,
        m.availability,
        m.image
      FROM MenuItems m
      INNER JOIN Stalls s
        ON s.stallId = m.stallId
      WHERE m.menuItemId = @menuItemId;
    `);

  return result.recordset[0] || null;
}

// PUT update menu item
async function updateMenuItem(menuItemId, menuItemData) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("menuItemId", sql.Int, menuItemId)
    .input("name", sql.VarChar(100), menuItemData.name)
    .input("category", sql.VarChar(50), menuItemData.category || null)
    .input("description", sql.VarChar(500), menuItemData.description || null)
    .input("price", sql.Decimal(10, 2), menuItemData.price)
    .input("prepTime", sql.Int, menuItemData.prepTime || null)
    .input("availability", sql.Char(1), menuItemData.availability || "Y")
    .input("image", sql.VarChar(255), menuItemData.image || null).query(`
      UPDATE MenuItems
      SET
        name = @name,
        category = @category,
        description = @description,
        price = @price,
        prepTime = @prepTime,
        availability = @availability,
        image = @image
      WHERE menuItemId = @menuItemId;
    `);

  if (result.rowsAffected[0] === 0) {
    return null;
  }

  return getMenuItemById(menuItemId);
}

module.exports = {
  getAllStalls,
  getMenuItemsByStallId,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
};
