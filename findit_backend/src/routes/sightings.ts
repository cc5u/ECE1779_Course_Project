import { Router } from "express";
import * as sightingController from "../controllers/sightingController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/reports/:reportId/sightings    — list sightings for a report
router.get("/:reportId/sightings", sightingController.listByReport);

// POST /api/reports/:reportId/sightings   — submit a sighting
router.post("/:reportId/sightings", requireAuth, sightingController.create);

// DELETE /api/sightings/:id               — delete own sighting
router.delete("/:id", requireAuth, sightingController.remove);

export default router;
