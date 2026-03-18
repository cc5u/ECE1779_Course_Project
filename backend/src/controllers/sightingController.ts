import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as sightingService from "../services/sightingService";
import { createSightingSchema } from "../utils/validation";
import { broadcastToReport } from "../utils/websocket";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createSightingSchema.parse(req.body);
    const sighting = await sightingService.createSighting(req.params.reportId, req.user!.id, input);

    // Broadcast real-time update to subscribers
    broadcastToReport(req.params.reportId, {
      type: "new_sighting",
      reportId: req.params.reportId,
      data: sighting,
    });

    res.status(201).json({ success: true, data: sighting });
  } catch (err) {
    next(err);
  }
}

export async function listByReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sightings = await sightingService.getSightingsByReport(req.params.reportId);
    res.json({ success: true, data: sightings });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await sightingService.deleteSighting(req.params.id, req.user!.id);
    res.json({ success: true, message: "Sighting deleted" });
  } catch (err) {
    next(err);
  }
}
