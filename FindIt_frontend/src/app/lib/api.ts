import { clearSession, getStoredSession, type AuthSession, type AuthUser } from "./auth";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_API_BASE_URL;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginPayload {
  uoftEmail: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  displayName: string;
}

export interface ReportImage {
  id: string;
  publicUrl: string;
  displayOrder?: number;
}

export interface ReportOwner {
  id: string;
  displayName: string;
}

export interface LostReport {
  id: string;
  itemName: string;
  description: string;
  lostTime: string;
  lostLocationText: string | null;
  latitude: number;
  longitude: number;
  status: "lost" | "possibly_found" | "found" | "archived";
  createdAt: string;
  updatedAt: string;
  owner?: ReportOwner;
  images?: ReportImage[];
  _count?: {
    sightings: number;
    messages: number;
  };
}

export interface MapReport {
  id: string;
  itemName: string;
  lostLocationText: string | null;
  latitude: number;
  longitude: number;
  status: "lost" | "possibly_found" | "found" | "archived";
  createdAt: string;
  owner: {
    displayName: string;
  };
  images: Array<{
    publicUrl: string;
  }>;
}

export interface CreateReportPayload {
  itemName: string;
  description: string;
  lostTime: string;
  lostLocationText?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const session = getStoredSession();
    if (!session?.token) {
      throw new ApiError("You need to sign in first.", 401);
    }
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    if (response.status === 401) {
      clearSession();
    }

    throw new ApiError(
      payload?.error || payload?.message || "Request failed",
      response.status,
      payload?.details,
    );
  }

  return payload;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await request<AuthResponseData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const response = await request<AuthResponseData>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function getProfile() {
  const response = await request<AuthUser & { _count?: { reports: number; sightings: number } }>("/auth/profile", {}, true);
  return response.data;
}

export async function getReports() {
  const response = await request<LostReport[]>("/reports");
  return {
    reports: response.data,
    pagination: response.pagination,
  };
}

export async function getMapReports() {
  const response = await request<MapReport[]>("/reports/map");
  return response.data;
}

export async function createReport(payload: CreateReportPayload) {
  const response = await request<LostReport>("/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
  return response.data;
}

export async function uploadReportImage(reportId: string, file: File) {
  const formData = new FormData();
  formData.append("images", file);

  const response = await request<ReportImage[]>(`/reports/${reportId}/images`, {
    method: "POST",
    body: formData,
  }, true);

  return response.data;
}

export function formatApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.details?.length) {
      return error.details.join(" ");
    }
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
