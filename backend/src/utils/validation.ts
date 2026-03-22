import { z } from "zod";

// ── Auth ──
export const registerSchema = z.object({
  uoftEmail: z
    .string()
    .email("Invalid email format")
    .refine((email) => email.endsWith("mail.utoronto.ca"), {
      message: "Must be a UofT email address",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name is required").max(100),
});

export const loginSchema = z.object({
  uoftEmail: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ── Reports ──
export const createReportSchema = z.object({
  itemName: z.string().min(1).max(255),
  description: z.string().min(1),
  lostTime: z.string().datetime({ message: "Invalid datetime format" }),
  lostLocationText: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().positive().optional().default(100),
});

export const updateReportSchema = z.object({
  itemName: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  lostTime: z.string().datetime().optional(),
  lostLocationText: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().positive().optional(),
  status: z.enum(["lost", "possibly_found", "found", "archived"]).optional(),
});

export const reportQuerySchema = z.object({
  status: z.enum(["lost", "possibly_found", "found", "archived"]).optional(),
  keyword: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  sortBy: z.enum(["created_at", "updated_at", "lost_time"]).optional().default("updated_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ── Sightings ──
export const createSightingSchema = z.object({
  note: z.string().optional(),
});

// ── Messages ──
export const createMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  messageText: z.string().min(1, "Message cannot be empty"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type CreateSightingInput = z.infer<typeof createSightingSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
