import { Router } from "express";
import * as imageController from "../controllers/imageController";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// POST /api/reports/:reportId/images   — upload images for a report (up to 5)
router.post(
  "/reports/:reportId/images",
  requireAuth,
  upload.array("images", 5),
  imageController.uploadReportImages
);

// POST /api/sightings/:sightingId/images — upload images for a sighting (up to 5)
router.post(
  "/sightings/:sightingId/images",
  requireAuth,
  upload.array("images", 5),
  imageController.uploadSightingImages
);

// DELETE /api/images/report/:imageId   — delete a report image
router.delete(
  "/images/report/:imageId",
  requireAuth,
  imageController.deleteReportImage
);

// DELETE /api/images/sighting/:imageId — delete a sighting image
router.delete(
  "/images/sighting/:imageId",
  requireAuth,
  imageController.deleteSightingImage
);

export default router;
