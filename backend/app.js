require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { sql, dbConfig } = require("./dbConfig");

const authRoutes = require("./routes/authRoutes"); 
const feedbackRoutes = require("./routes/feedbackRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stallRoutes = require("./routes/stallRoutes"); 
const menuItemRoutes = require("./routes/menuItemRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from the public folder
app.use(express.static(path.join(__dirname, "../public")));

// Test whether the backend is running
app.get("/api/test", (req, res) => {
  res.status(200).json({
    message: "Hawker backend is working",
  });
});

// Test SQL Server database connection
app.get("/api/database-test", async (req, res) => {
  try {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`
      SELECT DB_NAME() AS databaseName
    `);

    res.status(200).json({
      message: "Database connection successful",
      database: result.recordset[0].databaseName,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      error: "Database connection failed",
      details: error.message,
    });
  }
});

// =======================
// API ROUTES
// =======================

// Auth routes (register / login / profile)
app.use("/api/auth", authRoutes);

// Feedback routes
app.use("/api/feedback", feedbackRoutes);

// Order routes
app.use("/api/orders", orderRoutes);

// Stall & Menu routes 
app.use("/api/stalls", stallRoutes);

// Menu item routes
app.use("/api/menuitems", menuItemRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found",
  });
});

// General error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    error: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
