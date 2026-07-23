require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const { getPool } = require("./dbConfig");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// =======================================
// Socket.IO Setup
// =======================================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make Socket.IO available inside controllers using req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Customer joins a room for a specific delivery
  socket.on("joinDelivery", (deliveryId) => {
    if (!deliveryId) {
      return;
    }

    const roomName = `delivery-${deliveryId}`;
    socket.join(roomName);

    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  // Customer leaves a delivery room
  socket.on("leaveDelivery", (deliveryId) => {
    if (!deliveryId) {
      return;
    }

    const roomName = `delivery-${deliveryId}`;
    socket.leave(roomName);

    console.log(`Socket ${socket.id} left room ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// =======================================
// Middleware
// =======================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// =======================================
// Test Routes
// =======================================

// Test if API is running
app.get("/api/test", (req, res) => {
  res.json({
    message: "HawkerHub API is working",
  });
});

// Test database connection
app.get("/api/database-test", async (req, res, next) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .query("SELECT DB_NAME() AS databaseName");

    res.json({
      message: "Database connection successful",
      database: result.recordset[0].databaseName,
    });
  } catch (error) {
    next(error);
  }
});

// =======================================
// API Routes
// =======================================

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/stalls", require("./routes/stallRoutes"));
app.use("/api/menuitems", require("./routes/menuItemRoutes"));

app.use("/api/rental-agreements", require("./routes/rentalAgreementRoutes"));

app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/inspections", require("./routes/inspectionRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// New delivery tracking routes
app.use("/api/deliveries", require("./routes/deliveryRoutes"));

// =======================================
// 404 Handler
// =======================================

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found.",
  });
});

// =======================================
// Global Error Handler
// =======================================

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error.",
  });
});

// =======================================
// Start Server
// =======================================

// Use server.listen instead of app.listen
// because Socket.IO is attached to the HTTP server.
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
