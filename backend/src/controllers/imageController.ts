import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import * as imageService from "../services/imageService";

// POST /api/reports/:reportId/images
export async function uploadReportImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "No images uploaded" });
      return;
    }

    const images = await imageService.addReportImages(
      req.params.reportId,
      req.user!.id,
      files
    );

    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
}

// POST /api/sightings/:sightingId/images
export async function uploadSightingImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "No images uploaded" });
      return;
    }

    const images = await imageService.addSightingImages(
      req.params.sightingId,
      req.user!.id,
      files
    );

    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/images/report/:imageId
export async function deleteReportImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await imageService.deleteReportImage(req.params.imageId, req.user!.id);
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/images/sighting/:imageId
export async function deleteSightingImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await imageService.deleteSightingImage(req.params.imageId, req.user!.id);
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    next(err);
  }
}
