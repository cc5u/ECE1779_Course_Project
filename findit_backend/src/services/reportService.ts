import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { AppError } from "../middleware/errorHandler";
import { CreateReportInput, UpdateReportInput } from "../utils/validation";
import { ReportQueryParams } from "../types";

// ─── Create ──────────────────────────────────────────
export async function createReport(userId: string, input: CreateReportInput) {
  const report = await prisma.lostReport.create({
    data: {
      ownerId: userId,
      itemName: input.itemName,
      description: input.description,
      lostTime: new Date(input.lostTime),
      lostLocationText: input.lostLocationText,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      // Auto-expire after 30 days
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: {
      owner: {
        select: { id: true, displayName: true },
      },
      images: true,
    },
  });

  return report;
}

// ─── Get By ID ───────────────────────────────────────
export async function getReportById(reportId: string) {
  const report = await prisma.lostReport.findUnique({
    where: { id: reportId },
    include: {
      owner: {
        select: { id: true, displayName: true, uoftEmail: true },
      },
      images: {
        orderBy: { displayOrder: "asc" },
      },
      sightings: {
        include: {
          finder: {
            select: { id: true, displayName: true },
          },
          images: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { messages: true, sightings: true },
      },
    },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  return report;
}

// ─── List with Filters ──────────────────────────────
export async function listReports(query: ReportQueryParams) {
  const page = parseInt(query.page || "1", 10);
  const limit = Math.min(parseInt(query.limit || "20", 10), 100);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.LostReportWhereInput = {};

  // Status filter
  if (query.status && ["lost", "possibly_found", "found", "archived"].includes(query.status)) {
    where.status = query.status as any;
  } else {
    // Default: don't show archived
    where.status = { not: "archived" };
  }

  // Keyword search (item name or description)
  if (query.search) {
    where.OR = [
      { itemName: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { lostLocationText: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Geo filter: find reports within radius of a point
  // Note: This is approximate (flat-earth) — fine for campus scale
  if (query.latitude && query.longitude && query.radius) {
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);
    const radiusKm = parseFloat(query.radius) / 1000;

    // ~0.009 degrees per km of latitude
    const latDelta = radiusKm * 0.009;
    // Longitude degrees per km varies by latitude
    const lngDelta = radiusKm * (0.009 / Math.cos((lat * Math.PI) / 180));

    where.latitude = {
      gte: lat - latDelta,
      lte: lat + latDelta,
    };
    where.longitude = {
      gte: lng - lngDelta,
      lte: lng + lngDelta,
    };
  }

  // Sort
  const sortBy = query.sortBy || "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";
  const orderBy: Prisma.LostReportOrderByWithRelationInput = { [sortBy]: order };

  const [reports, total] = await Promise.all([
    prisma.lostReport.findMany({
      where,
      include: {
        owner: {
          select: { id: true, displayName: true },
        },
        images: {
          take: 1,
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: { sightings: true, messages: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.lostReport.count({ where }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Update ──────────────────────────────────────────
export async function updateReport(reportId: string, userId: string, input: UpdateReportInput) {
  // Verify ownership
  const existing = await prisma.lostReport.findUnique({
    where: { id: reportId },
    select: { ownerId: true },
  });

  if (!existing) {
    throw new AppError("Report not found", 404);
  }
  if (existing.ownerId !== userId) {
    throw new AppError("You can only edit your own reports", 403);
  }

  const updateData: any = { ...input };

  // If marking as found, set the confirmation timestamp
  if (input.status === "found") {
    updateData.foundConfirmedAt = new Date();
  }

  // Convert lostTime string to Date if provided
  if (input.lostTime) {
    updateData.lostTime = new Date(input.lostTime);
  }

  const report = await prisma.lostReport.update({
    where: { id: reportId },
    data: updateData,
    include: {
      owner: {
        select: { id: true, displayName: true },
      },
      images: true,
    },
  });

  return report;
}

// ─── Delete ──────────────────────────────────────────
export async function deleteReport(reportId: string, userId: string) {
  const existing = await prisma.lostReport.findUnique({
    where: { id: reportId },
    select: { ownerId: true },
  });

  if (!existing) {
    throw new AppError("Report not found", 404);
  }
  if (existing.ownerId !== userId) {
    throw new AppError("You can only delete your own reports", 403);
  }

  await prisma.lostReport.delete({ where: { id: reportId } });
}

// ─── Get Reports by Owner ────────────────────────────
export async function getReportsByOwner(userId: string) {
  return prisma.lostReport.findMany({
    where: { ownerId: userId },
    include: {
      images: {
        take: 1,
        orderBy: { displayOrder: "asc" },
      },
      _count: {
        select: { sightings: true, messages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get Map Data (active reports with coordinates) ──
export async function getMapReports() {
  return prisma.lostReport.findMany({
    where: {
      status: { in: ["lost", "possibly_found"] },
    },
    select: {
      id: true,
      itemName: true,
      lostLocationText: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      owner: {
        select: { displayName: true },
      },
      images: {
        take: 1,
        orderBy: { displayOrder: "asc" },
        select: { publicUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
