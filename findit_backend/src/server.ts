import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import prisma from "./prisma/client";
import { errorHandler } from "./middleware/errorHandler";
import {
  closeWebSocketPubSub,
  getRealtimeTransportMode,
  initializeWebSocketPubSub,
  setupWebSocket,
} from "./utils/websocket";
import { getImageStorageMode } from "./services/storageService";

// Route imports
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import reportRoutes from "./routes/reports";
import sightingRoutes from "./routes/sightings";
import messageRoutes from "./routes/messages";
import imageRoutes from "./routes/images";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Global Middleware ───────────────────────────────
app.use(cors({
  origin(origin, callback) {
    if (allowedOrigins.length === 0 || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ──────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Sighting routes are nested under reports but also have standalone delete
app.use("/api/reports", sightingRoutes);         // /api/reports/:reportId/sightings
app.use("/api/sightings", sightingRoutes);       // /api/sightings/:id (delete)

// Message routes
app.use("/api/reports", messageRoutes);           // /api/reports/:reportId/messages
app.use("/api/messages", messageRoutes);          // /api/messages/conversations

// Image routes
app.use("/api", imageRoutes);

// ─── 404 Handler ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────
const server = http.createServer(app);

// Attach WebSocket server
setupWebSocket(server);

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    await initializeWebSocketPubSub();
    console.log("Database connected successfully");
    console.log(`Image storage mode: ${getImageStorageMode()}`);
    console.log(`Realtime transport mode: ${getRealtimeTransportMode()}`);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/auth/profile`);
      console.log(`  GET    /api/reports`);
      console.log(`  POST   /api/reports`);
      console.log(`  GET    /api/reports/map`);
      console.log(`  GET    /api/reports/mine`);
      console.log(`  GET    /api/reports/:id`);
      console.log(`  PUT    /api/reports/:id`);
      console.log(`  DELETE /api/reports/:id`);
      console.log(`  GET    /api/reports/:id/sightings`);
      console.log(`  POST   /api/reports/:id/sightings`);
      console.log(`  DELETE /api/sightings/:id`);
      console.log(`  GET    /api/reports/:id/messages`);
      console.log(`  POST   /api/reports/:id/messages`);
      console.log(`  GET    /api/messages/conversations`);
      console.log(`  POST   /api/reports/:id/images`);
      console.log(`  POST   /api/sightings/:id/images`);
      console.log(`  DELETE /api/images/report/:id`);
      console.log(`  DELETE /api/images/sighting/:id\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");
  server.close();
  await closeWebSocketPubSub();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received. Shutting down...");
  server.close();
  await closeWebSocketPubSub();
  await prisma.$disconnect();
  process.exit(0);
});

start();
