import fs from "fs";
import path from "path";
import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * Save uploaded files as report images in the database
 */
export async function addReportImages(
  reportId: string,
  userId: string,
  files: Express.Multer.File[]
) {
  // Verify report exists and user owns it
  const report = await prisma.lostReport.findUnique({
    where: { id: reportId },
    select: { ownerId: true },
  });

  if (!report) {
    // Clean up uploaded files since we're rejecting
    cleanupFiles(files);
    throw new AppError("Report not found", 404);
  }
  if (report.ownerId !== userId) {
    cleanupFiles(files);
    throw new AppError("You can only add images to your own reports", 403);
  }

  // Get current max display order
  const lastImage = await prisma.reportImage.findFirst({
    where: { reportId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  let displayOrder = (lastImage?.displayOrder ?? -1) + 1;

  // Create database records for each uploaded file
  const images = await Promise.all(
    files.map((file) => {
      const record = prisma.reportImage.create({
        data: {
          reportId,
          objectKey: file.filename,
          publicUrl: `${BASE_URL}/uploads/${file.filename}`,
          displayOrder: displayOrder++,
        },
      });
      return record;
    })
  );

  return images;
}

/**
 * Save uploaded files as sighting images in the database
 */
export async function addSightingImages(
  sightingId: string,
  userId: string,
  files: Express.Multer.File[]
) {
  // Verify sighting exists and user owns it
  const sighting = await prisma.sighting.findUnique({
    where: { id: sightingId },
    select: { finderId: true },
  });

  if (!sighting) {
    cleanupFiles(files);
    throw new AppError("Sighting not found", 404);
  }
  if (sighting.finderId !== userId) {
    cleanupFiles(files);
    throw new AppError("You can only add images to your own sightings", 403);
  }

  // Get current max display order
  const lastImage = await prisma.sightingImage.findFirst({
    where: { sightingId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  let displayOrder = (lastImage?.displayOrder ?? -1) + 1;

  const images = await Promise.all(
    files.map((file) => {
      return prisma.sightingImage.create({
        data: {
          sightingId,
          objectKey: file.filename,
          publicUrl: `${BASE_URL}/uploads/${file.filename}`,
          displayOrder: displayOrder++,
        },
      });
    })
  );

  return images;
}

/**
 * Delete a report image (owner only)
 */
export async function deleteReportImage(imageId: string, userId: string) {
  const image = await prisma.reportImage.findUnique({
    where: { id: imageId },
    include: {
      report: { select: { ownerId: true } },
    },
  });

  if (!image) {
    throw new AppError("Image not found", 404);
  }
  if (image.report.ownerId !== userId) {
    throw new AppError("You can only delete images from your own reports", 403);
  }

  // Delete file from disk
  deleteFileFromDisk(image.objectKey);

  // Delete database record
  await prisma.reportImage.delete({ where: { id: imageId } });
}

/**
 * Delete a sighting image (owner only)
 */
export async function deleteSightingImage(imageId: string, userId: string) {
  const image = await prisma.sightingImage.findUnique({
    where: { id: imageId },
    include: {
      sighting: { select: { finderId: true } },
    },
  });

  if (!image) {
    throw new AppError("Image not found", 404);
  }
  if (image.sighting.finderId !== userId) {
    throw new AppError("You can only delete images from your own sightings", 403);
  }

  deleteFileFromDisk(image.objectKey);
  await prisma.sightingImage.delete({ where: { id: imageId } });
}

// ─── Helpers ─────────────────────────────────────────

function cleanupFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // File may not exist, ignore
    }
  }
}

function deleteFileFromDisk(objectKey: string) {
  const filePath = path.join(process.cwd(), "uploads", objectKey);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    console.warn(`Failed to delete file: ${filePath}`);
  }
}
