const { sql, dbConfig } = require("../dbConfig");

async function findUserByEmail(email) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("email", sql.VarChar(100), email).query(`
      SELECT
        userId,
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        role,
        createdAt
      FROM Users
      WHERE email = @email
    `);

  return result.recordset[0];
}

async function findUserById(userId) {
  const connection = await sql.connect(dbConfig);

  const result = await connection.request().input("userId", sql.Int, userId)
    .query(`
      SELECT
        userId,
        firstName,
        lastName,
        email,
        phone,
        role,
        createdAt
      FROM Users
      WHERE userId = @userId
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

async function linkStallRecord(userId, stallName, cuisine, location) {
  const connection = await sql.connect(dbConfig);

  const result = await connection
    .request()
    .input("userId", sql.Int, userId)
    .input("stallName", sql.VarChar(100), stallName)
    .input("cuisine", sql.VarChar(50), cuisine || null)
    .input("location", sql.VarChar(100), location || null).query(`
      INSERT INTO Stalls (ownerId, stallName, cuisine, location)
      OUTPUT INSERTED.stallId
      VALUES (@userId, @stallName, @cuisine, @location)
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
