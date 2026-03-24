import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

// GET /api/health — health check endpoint for monitoring and load balancers
router.get("/", async (_req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

export default router;
