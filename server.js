const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Setup Socket.io with comprehensive CORS settings
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  },
  // Enable all transport methods for maximum compatibility
  transports: ["websocket", "polling"],
  // Improve reconnection behavior
  pingTimeout: 30000,
  pingInterval: 25000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// Add express middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Track connected users and their locations
const users = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  users[socket.id] = null;

  // Update total users count
  io.emit("total-users", Object.keys(users).length);

  // Handle location updates
  socket.on("send-location", (data) => {
    const { latitude, longitude } = data;
    users[socket.id] = { latitude, longitude };

    // Broadcast the location to all clients
    io.emit("received-location", {
      id: socket.id,
      latitude,
      longitude,
    });

    // Log location for debugging
    console.log(`User ${socket.id} location: ${latitude}, ${longitude}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    io.emit("user-disconnected", socket.id);
    io.emit("total-users", Object.keys(users).length);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Add a health check route
app.get("/health", (req, res) => {
  res.send({
    status: "ok",
    connections: Object.keys(users).length,
    timestamp: new Date().toISOString(),
  });
});

// Listen on all network interfaces
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
});
