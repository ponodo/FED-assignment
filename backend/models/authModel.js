const { sql, dbConfig } = require("../dbConfig");

async function findUserByEmail(email) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("email", sql.VarChar(100), email).query(`
      SELECT
        u.userId,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.passwordHash,
        u.role,
        u.createdAt,
        c.customerId,
        s.stallId
      FROM Users u
      LEFT JOIN Customers c
        ON u.userId = c.userId
      LEFT JOIN Stalls s
        ON u.userId = s.ownerId
      WHERE u.email = @email
    `);

  return result.recordset[0];
}

async function findUserById(userId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().input("userId", sql.Int, userId)
    .query(`
      SELECT
        u.userId,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.role,
        u.createdAt,
        c.customerId,
        s.stallId
      FROM Users u
      LEFT JOIN Customers c
        ON u.userId = c.userId
      LEFT JOIN Stalls s
        ON u.userId = s.ownerId
      WHERE u.userId = @userId
    `);

  return result.recordset[0];
}

async function createUser(userData) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("firstName", sql.VarChar(50), userData.firstName)
    .input("lastName", sql.VarChar(50), userData.lastName)
    .input("email", sql.VarChar(100), userData.email)
    .input("phone", sql.VarChar(8), userData.phone || null)
    .input("passwordHash", sql.VarChar(255), userData.passwordHash)
    .input("role", sql.VarChar(20), userData.role).query(`
      INSERT INTO Users (
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role
      )
      OUTPUT
        INSERTED.userId,
        INSERTED.firstName,
        INSERTED.lastName,
        INSERTED.email,
        INSERTED.phone,
        INSERTED.role,
        INSERTED.createdAt
      VALUES (
        @firstName,
        @lastName,
        @email,
        @phone,
        @passwordHash,
        @role
      )
    `);

  return result.recordset[0];
}

async function updateUser(userId, userData) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("userId", sql.Int, userId)
    .input("firstName", sql.VarChar(50), userData.firstName)
    .input("lastName", sql.VarChar(50), userData.lastName)
    .input("phone", sql.VarChar(8), userData.phone || null).query(`
      UPDATE Users
      SET
        firstName = @firstName,
        lastName = @lastName,
        phone = @phone
      OUTPUT
        INSERTED.userId,
        INSERTED.firstName,
        INSERTED.lastName,
        INSERTED.email,
        INSERTED.phone,
        INSERTED.role,
        INSERTED.createdAt
      WHERE userId = @userId
    `);

  return result.recordset[0];
}

async function deleteUser(userId) {
  const connection = await sql.connect(dbConfig);

  // Customers/Stalls reference Users via a foreign key, so those linked
  // rows must go first or the delete below will be rejected by SQL Server.
  await connection.request().input("userId", sql.Int, userId).query(`
    DELETE FROM Customers WHERE userId = @userId
  `);

  await connection.request().input("userId", sql.Int, userId).query(`
    DELETE FROM Stalls WHERE ownerId = @userId
  `);

  const result = await connection.request().input("userId", sql.Int, userId)
    .query(`
      DELETE FROM Users
      OUTPUT DELETED.userId
      WHERE userId = @userId
    `);

  return result.recordset[0];
}

// Links a newly-created user to a business-facing row (Customers / Stalls)
// so the rest of the app (orders, feedback, menu, etc.) keeps working.
async function linkCustomerRecord(userId, customerName, email) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("userId", sql.Int, userId)
    .input("customerName", sql.VarChar(100), customerName)
    .input("email", sql.VarChar(100), email).query(`
      INSERT INTO Customers (userId, customerName, email)
      OUTPUT INSERTED.customerId
      VALUES (@userId, @customerName, @email)
    `);

  return result.recordset[0];
}

async function linkStallRecord(userId, stallName, cuisine, hawkerCentre) {
  const connection = await sql.connect(dbConfig);

  // stallId is no longer auto-generated (Stalls.stallId is a plain
  // PRIMARY KEY, not IDENTITY), so we work out the next id ourselves.
  const nextIdResult = await connection.request().query(`
    SELECT ISNULL(MAX(stallId), 0) + 1 AS nextStallId FROM Stalls
  `);

  const nextStallId = nextIdResult.recordset[0].nextStallId;

  const result = await connection
    .request()
    .input("stallId", sql.Int, nextStallId)
    .input("userId", sql.Int, userId)
    .input("stallName", sql.VarChar(100), stallName)
    .input("cuisine", sql.VarChar(50), cuisine || null)
    .input("hawkerCentre", sql.VarChar(100), hawkerCentre || null).query(`
      INSERT INTO Stalls (stallId, ownerId, stallName, cuisine, hawkerCentre)
      OUTPUT INSERTED.stallId
      VALUES (@stallId, @userId, @stallName, @cuisine, @hawkerCentre)
    `);

  return result.recordset[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  linkCustomerRecord,
  linkStallRecord,
};
