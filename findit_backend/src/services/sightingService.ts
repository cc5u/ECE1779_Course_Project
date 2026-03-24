import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { CreateSightingInput } from "../utils/validation";
import { broadcastToReport } from "../utils/websocket";

export async function createSighting(reportId: string, finderId: string, input: CreateSightingInput) {
  // Verify report exists and is active
  const report = await prisma.lostReport.findUnique({
    where: { id: reportId },
    select: { id: true, ownerId: true, status: true },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }
  if (report.status === "archived" || report.status === "found") {
    throw new AppError("Cannot add sightings to a resolved or archived report", 400);
  }
  if (report.ownerId === finderId) {
    throw new AppError("You cannot submit a sighting for your own report", 400);
  }

  const sighting = await prisma.sighting.create({
    data: {
      reportId,
      finderId,
      note: input.note,
    },
    include: {
      finder: {
        select: { id: true, displayName: true },
      },
      images: true,
    },
  });

  // Broadcast new sighting to all subscribers of this report
  broadcastToReport(reportId, { type: "new_sighting", reportId, data: sighting });

  // Auto-update report status to possibly_found if still 'lost'
  if (report.status === "lost") {
    await prisma.lostReport.update({
      where: { id: reportId },
      data: { status: "possibly_found" },
    });

    // Broadcast the status change too
    broadcastToReport(reportId, {
      type: "status_change",
      reportId,
      data: { oldStatus: "lost", newStatus: "possibly_found" },
    });
  }

  return sighting;
}

export async function getSightingsByReport(reportId: string) {
  return prisma.sighting.findMany({
    where: { reportId },
    include: {
      finder: {
        select: { id: true, displayName: true },
      },
      images: {
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSighting(sightingId: string, userId: string) {
  const sighting = await prisma.sighting.findUnique({
    where: { id: sightingId },
    select: { finderId: true },
  });

  if (!sighting) {
    throw new AppError("Sighting not found", 404);
  }
  if (sighting.finderId !== userId) {
    throw new AppError("You can only delete your own sightings", 403);
  }

  await prisma.sighting.delete({ where: { id: sightingId } });
}
