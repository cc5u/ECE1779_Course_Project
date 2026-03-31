import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as sightingService from "../services/sightingService";
import { createSightingSchema } from "../utils/validation";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createSightingSchema.parse(req.body);
    const reportId = String(req.params.reportId);
    const sighting = await sightingService.createSighting(reportId, req.user!.id, input);

    res.status(201).json({ success: true, data: sighting });
  } catch (err) {
    next(err);
  }
}

export async function listByReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reportId = String(req.params.reportId);
    const sightings = await sightingService.getSightingsByReport(reportId);
    res.json({ success: true, data: sightings });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sightingId = String(req.params.id);
    await sightingService.deleteSighting(sightingId, req.user!.id);
    res.json({ success: true, message: "Sighting deleted" });
  } catch (err) {
    next(err);
  }
}
