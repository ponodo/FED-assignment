const { sql, dbConfig } = require("../dbConfig");

//GET all stalls
async function getAllStalls() {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query = `
        SELECT 
        stallId,
        stallName,
        cuisine,
        hawkerCentre,
        address,
        hygieneGrade,
        rating,
        totalReviews,
        deliveryAvailable,
        pickupAvailable
        FROM Stalls
    `;
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAllStalls:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
// GET menu items by StallID
async function getMenuItemsByStallId(stallId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query = `
        SELECT 
        menuItemId,
        stallId,
        stallName,
        name,
        category,
        description,
        price,
        prepTime,
        availability,
        image
        FROM MenuItems
        WHERE stallId = @stallId
    `;

    const request = connection.request();
    request.input("stallId", sql.Int, stallId);

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getMenuItemsByStallId:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// PUT update menu item
async function createMenuItem(menuItemData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query = `
        INSERT INTO MenuItems 
        (stallId, stallName, name, category, description, price, prepTime, availability, image)
        VALUES 
        (@stallId, @stallName, @name, @category, @description, @price, @prepTime, @availability, @image);

        SELECT SCOPE_IDENTITY() AS menuItemId;
        `;

    const request = connection.request();
    request.input("stallId", sql.Int, menuItemData.stallId);
    request.input("stallName", sql.VarChar(100), menuItemData.stallName);
    request.input("name", sql.VarChar(100), menuItemData.name);
    request.input("category", sql.VarChar(50), menuItemData.category);
    request.input("description", sql.VarChar(500), menuItemData.description);
    request.input("price", sql.Decimal(6, 2), menuItemData.price);
    request.input("prepTime", sql.Int, menuItemData.prepTime);
    request.input("availability", sql.Char(1), menuItemData.availability);
    request.input("image", sql.VarChar(255), menuItemData.image);

    const result = await request.query(query);
    const newMenuItemId = result.recordset[0].menuItemId;

    return await getMenuItemById(newMenuItemId);
  } catch (error) {
    console.error("Database error in createMenuItem:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
// GET one menu item by ID
async function getMenuItemById(menuItemId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query = `
    SELECT
        menuItemId,
        stallId,
        itemName AS name,
        category,
        description,
        price,
        prepTime,
        availability,
        image
    FROM MenuItems
    WHERE stallId = @stallId
`;

    const request = connection.request();
    request.input("menuItemId", sql.Int, menuItemId);

    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error("Database error in getMenuItemById:", error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

//PUT update menu item
async function updateMenuItem(menuItemId, menuItemData) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const query = `
        UPDATE MenuItems
        SET 
        name = @name,
        category = @category,
        description = @description,
        price = @price,
        prepTime = @prepTime,
        availability = @availability,
        image = @image
        WHERE menuItemId = @menuItemId
        `;

    const request = connection.request();

    request.input("menuItemId", sql.Int, menuItemId);
    request.input("name", sql.VarChar(100), menuItemData.name);
    request.input("category", sql.VarChar(50), menuItemData.category);
    request.input("description", sql.VarChar(500), menuItemData.description);
    request.input("price", sql.Decimal(6, 2), menuItemData.price);
    request.input("prepTime", sql.Int, menuItemData.prepTime);
    request.input("availability", sql.Char(1), menuItemData.availability);
    request.input("image", sql.VarChar(255), menuItemData.image);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null;
    }
    return await getMenuItemById(menuItemId);
  } catch (error) {
    console.error("Database error in updateMenuItem:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
module.exports = {
  getAllStalls,
  getMenuItemsByStallId,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
};
