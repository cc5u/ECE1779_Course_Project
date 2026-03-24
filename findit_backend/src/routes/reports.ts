import { Router } from "express";
import * as reportController from "../controllers/reportController";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

// GET /api/reports          — list reports with filters (public)
router.get("/", optionalAuth, reportController.list);

// GET /api/reports/map      — get map pin data (public)
router.get("/map", reportController.getMapData);

// GET /api/reports/mine     — get current user's reports
router.get("/mine", requireAuth, reportController.getMyReports);

// POST /api/reports         — create a report
router.post("/", requireAuth, reportController.create);

// GET /api/reports/:id      — get report detail (public)
router.get("/:id", optionalAuth, reportController.getById);

// PUT /api/reports/:id      — update a report (owner only)
router.put("/:id", requireAuth, reportController.update);

// DELETE /api/reports/:id   — delete a report (owner only)
router.delete("/:id", requireAuth, reportController.remove);

export default router;
