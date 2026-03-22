import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { deleteStoredImage, storeImage } from "./storageService";

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
    throw new AppError("Report not found", 404);
  }
  if (report.ownerId !== userId) {
    throw new AppError("You can only add images to your own reports", 403);
  }

  // Get current max display order
  const lastImage = await prisma.reportImage.findFirst({
    where: { reportId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  let displayOrder = (lastImage?.displayOrder ?? -1) + 1;

  const uploadedAssets: Array<{ objectKey: string; publicUrl: string }> = [];

  try {
    for (const file of files) {
      uploadedAssets.push(
        await storeImage({
          folder: `reports/${reportId}`,
          file,
        })
      );
    }

    return await Promise.all(
      uploadedAssets.map((asset) =>
        prisma.reportImage.create({
          data: {
            reportId,
            objectKey: asset.objectKey,
            publicUrl: asset.publicUrl,
            displayOrder: displayOrder++,
          },
        })
      )
    );
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw error;
  }
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
    throw new AppError("Sighting not found", 404);
  }
  if (sighting.finderId !== userId) {
    throw new AppError("You can only add images to your own sightings", 403);
  }

  // Get current max display order
  const lastImage = await prisma.sightingImage.findFirst({
    where: { sightingId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  let displayOrder = (lastImage?.displayOrder ?? -1) + 1;

  const uploadedAssets: Array<{ objectKey: string; publicUrl: string }> = [];

  try {
    for (const file of files) {
      uploadedAssets.push(
        await storeImage({
          folder: `sightings/${sightingId}`,
          file,
        })
      );
    }

    return await Promise.all(
      uploadedAssets.map((asset) =>
        prisma.sightingImage.create({
          data: {
            sightingId,
            objectKey: asset.objectKey,
            publicUrl: asset.publicUrl,
            displayOrder: displayOrder++,
          },
        })
      )
    );
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw error;
  }
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

  await deleteStoredImage(image.objectKey);

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

  await deleteStoredImage(image.objectKey);
  await prisma.sightingImage.delete({ where: { id: imageId } });
}

// ─── Helpers ─────────────────────────────────────────

async function cleanupUploadedAssets(assets: Array<{ objectKey: string }>) {
  await Promise.all(
    assets.map(async (asset) => {
      try {
        await deleteStoredImage(asset.objectKey);
      } catch {
        // Best-effort cleanup only.
      }
    })
  );
}
