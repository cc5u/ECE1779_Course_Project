import { clearSession, getStoredSession, type AuthSession, type AuthUser } from "./auth";

function getDefaultApiBaseUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:3000/api";
}

function getDefaultWebSocketBaseUrl(apiBaseUrl: string) {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }

  return apiBaseUrl.replace(/\/api$/, "").replace(/^http/i, "ws");
}

const DEFAULT_API_BASE_URL = getDefaultApiBaseUrl();
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_API_BASE_URL;
const DEFAULT_WS_BASE_URL = getDefaultWebSocketBaseUrl(API_BASE_URL);
const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_WS_BASE_URL;

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

type RawLostReport = Omit<LostReport, "images"> & { images?: RawImage[] | null };
type RawMapReport = Omit<MapReport, "images"> & { images?: RawImage[] | null };
type RawSighting = Omit<Sighting, "images" | "finder"> & {
  images?: RawImage[] | null;
  finder?: ReportOwner | null;
  user?: ReportOwner | null;
  owner?: ReportOwner | null;
};
type RawMessage = {
  id?: string;
  reportId?: string;
  report_id?: string;
  senderId?: string;
  sender_id?: string;
  receiverId?: string;
  receiver_id?: string;
  messageText?: string | null;
  message?: string | null;
  text?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  sender?: RawOwnerLike | null;
  senderUser?: RawOwnerLike | null;
  fromUser?: RawOwnerLike | null;
  receiver?: RawOwnerLike | null;
  receiverUser?: RawOwnerLike | null;
  toUser?: RawOwnerLike | null;
};
type RawConversation = {
  reportId?: string;
  report_id?: string;
  report?: Partial<LostReport> | null;
  participant?: RawOwnerLike | null;
  otherUser?: RawOwnerLike | null;
  user?: RawOwnerLike | null;
  counterpart?: RawOwnerLike | null;
  lastMessage?: RawMessage | null;
  latestMessage?: RawMessage | null;
  message?: RawMessage | null;
  unreadCount?: number | null;
  unread_count?: number | null;
};
type RawPresence = {
  userId?: string;
  user_id?: string;
  id?: string;
  online?: boolean | null;
  isOnline?: boolean | null;
  status?: string | null;
};
type RawOwnerLike = {
  id?: string;
  userId?: string;
  user_id?: string;
  displayName?: string;
  display_name?: string;
  name?: string;
};

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
  latitude: number | null;
  longitude: number | null;
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

export type ReportStatus = LostReport["status"];

export interface Sighting {
  id: string;
  note: string | null;
  createdAt: string;
  finder?: ReportOwner;
  images?: ReportImage[];
}

export interface ReportMessage {
  id: string;
  reportId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  createdAt: string;
  updatedAt?: string;
  sender?: ReportOwner;
  receiver?: ReportOwner;
}

export interface MessageConversation {
  reportId: string;
  reportItemName: string;
  reportStatus?: LostReport["status"];
  participant?: ReportOwner;
  lastMessage?: ReportMessage;
  unreadCount: number;
}

export interface MapReport {
  id: string;
  itemName: string;
  lostLocationText: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "lost" | "possibly_found" | "found" | "archived";
  createdAt: string;
  owner: {
    displayName: string;
  };
  images: ReportImage[];
}

type RawImage = {
  id?: string;
  publicUrl?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  url?: string | null;
  key?: string | null;
  objectKey?: string | null;
  displayOrder?: number;
};

type CoordinateValue = number | string | null | undefined;

export interface CreateReportPayload {
  itemName: string;
  description: string;
  lostTime: string;
  lostLocationText?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface CreateSightingPayload {
  note?: string;
}

export interface SendReportMessagePayload {
  receiverId: string;
  messageText: string;
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

  if (response.ok && payload === null) {
    return {
      success: true,
      data: null as T,
    };
  }

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

function normalizeImage(image: RawImage): ReportImage {
  return {
    id: image.id ?? image.key ?? image.objectKey ?? crypto.randomUUID(),
    publicUrl:
      image.publicUrl ??
      image.imageUrl ??
      image.image_url ??
      image.url ??
      "",
    displayOrder: image.displayOrder,
  };
}

function normalizeCoordinate(value: CoordinateValue) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeLostReport(report: RawLostReport): LostReport {
  return {
    ...report,
    latitude: normalizeCoordinate(report.latitude),
    longitude: normalizeCoordinate(report.longitude),
    images: report.images?.map(normalizeImage) ?? [],
  };
}

function normalizeMapReport(report: RawMapReport): MapReport {
  return {
    ...report,
    latitude: normalizeCoordinate(report.latitude),
    longitude: normalizeCoordinate(report.longitude),
    images: report.images?.map(normalizeImage) ?? [],
  };
}

function normalizeSighting(sighting: RawSighting): Sighting {
  return {
    ...sighting,
    finder: sighting.finder ?? sighting.user ?? sighting.owner ?? undefined,
    images: sighting.images?.map(normalizeImage) ?? [],
  };
}

function normalizeOwner(value?: RawOwnerLike | null): ReportOwner | undefined {
  const id = value?.id ?? value?.userId ?? value?.user_id;
  const displayName = value?.displayName ?? value?.display_name ?? value?.name;

  if (!id && !displayName) {
    return undefined;
  }

  return {
    id: id ?? crypto.randomUUID(),
    displayName: displayName ?? "Unknown user",
  };
}

function normalizeMessage(message: RawMessage): ReportMessage {
  const sender = normalizeOwner(message.sender ?? message.senderUser ?? message.fromUser);
  const receiver = normalizeOwner(message.receiver ?? message.receiverUser ?? message.toUser);

  return {
    id: message.id ?? crypto.randomUUID(),
    reportId: message.reportId ?? message.report_id ?? "",
    senderId: message.senderId ?? message.sender_id ?? sender?.id ?? "",
    receiverId: message.receiverId ?? message.receiver_id ?? receiver?.id ?? "",
    messageText: message.messageText ?? message.message ?? message.text ?? "",
    createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
    updatedAt: message.updatedAt ?? message.updated_at,
    sender,
    receiver,
  };
}

function getConversationParticipant(
  conversation: RawConversation,
  currentUserId?: string | null,
): ReportOwner | undefined {
  const directParticipant = normalizeOwner(
    conversation.participant ??
      conversation.otherUser ??
      conversation.user ??
      conversation.counterpart,
  );

  if (directParticipant) {
    return directParticipant;
  }

  const lastMessage = conversation.lastMessage ?? conversation.latestMessage ?? conversation.message;
  if (!lastMessage) {
    return undefined;
  }

  const sender = normalizeOwner(lastMessage.sender ?? lastMessage.senderUser ?? lastMessage.fromUser);
  const receiver = normalizeOwner(lastMessage.receiver ?? lastMessage.receiverUser ?? lastMessage.toUser);

  if (!currentUserId) {
    return sender ?? receiver;
  }

  if (sender?.id === currentUserId) {
    return receiver;
  }

  if (receiver?.id === currentUserId) {
    return sender;
  }

  return sender ?? receiver;
}

function normalizeConversation(conversation: RawConversation, currentUserId?: string | null): MessageConversation {
  const report = conversation.report;
  const lastMessage = conversation.lastMessage ?? conversation.latestMessage ?? conversation.message;

  return {
    reportId: conversation.reportId ?? conversation.report_id ?? report?.id ?? "",
    reportItemName: report?.itemName ?? "Lost item report",
    reportStatus: report?.status,
    participant: getConversationParticipant(conversation, currentUserId),
    lastMessage: lastMessage ? normalizeMessage(lastMessage) : undefined,
    unreadCount: conversation.unreadCount ?? conversation.unread_count ?? 0,
  };
}

export function parseReportMessage(value: unknown): ReportMessage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const normalized = normalizeMessage(value as RawMessage);
  if (!normalized.reportId || !normalized.senderId || !normalized.receiverId || !normalized.messageText.trim()) {
    return null;
  }

  return normalized;
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
  const response = await request<RawLostReport[]>("/reports");
  return {
    reports: response.data.map(normalizeLostReport),
    pagination: response.pagination,
  };
}

export async function getMyReports() {
  const response = await request<RawLostReport[]>("/reports/mine", {}, true);
  return response.data.map(normalizeLostReport);
}

export async function getReport(reportId: string) {
  const response = await request<RawLostReport>(`/reports/${reportId}`, {}, true);
  return normalizeLostReport(response.data);
}

export async function getMapReports() {
  const response = await request<RawMapReport[]>("/reports/map");
  return response.data.map(normalizeMapReport);
}

export async function createReport(payload: CreateReportPayload) {
  const response = await request<LostReport>("/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
  return response.data;
}

export async function uploadReportImages(reportId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await request<RawImage[]>(`/reports/${reportId}/images`, {
    method: "POST",
    body: formData,
  }, true);

  return response.data.map(normalizeImage);
}

export async function uploadReportImage(reportId: string, file: File) {
  return uploadReportImages(reportId, [file]);
}

export async function createSighting(reportId: string, payload: CreateSightingPayload) {
  const response = await request<Sighting>(`/reports/${reportId}/sightings`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);

  return response.data;
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const response = await request<LostReport>(`/reports/${reportId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  }, true);

  return normalizeLostReport(response.data as RawLostReport);
}

export async function deleteReport(reportId: string) {
  await request<null>(`/reports/${reportId}`, {
    method: "DELETE",
  }, true);
}

export async function uploadSightingImages(sightingId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await request<RawImage[]>(`/sightings/${sightingId}/images`, {
    method: "POST",
    body: formData,
  }, true);

  return response.data.map(normalizeImage);
}

export async function uploadSightingImage(sightingId: string, file: File) {
  return uploadSightingImages(sightingId, [file]);
}

export async function getSightings(reportId: string) {
  const response = await request<RawSighting[]>(`/reports/${reportId}/sightings`);
  return response.data.map(normalizeSighting);
}

export async function getReportMessages(reportId: string) {
  const response = await request<RawMessage[]>(`/reports/${reportId}/messages`, {}, true);
  return response.data.map(normalizeMessage);
}

export async function sendReportMessage(reportId: string, payload: SendReportMessagePayload) {
  const response = await request<RawMessage>(`/reports/${reportId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);

  return normalizeMessage(response.data);
}

export async function getMessageConversations(currentUserId?: string | null) {
  const response = await request<RawConversation[]>("/messages/conversations", {}, true);
  return response.data.map((conversation) => normalizeConversation(conversation, currentUserId));
}

export function parsePresenceUpdate(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const presence = value as RawPresence;
  const userId = presence.userId ?? presence.user_id ?? presence.id ?? "";
  const rawStatus = typeof presence.status === "string" ? presence.status.toLowerCase() : "";
  const online =
    typeof presence.online === "boolean"
      ? presence.online
      : typeof presence.isOnline === "boolean"
        ? presence.isOnline
        : rawStatus
          ? rawStatus === "online" || rawStatus === "active"
          : null;

  if (!userId || online === null) {
    return null;
  }

  return {
    userId,
    online,
  };
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

export function getWebSocketBaseUrl() {
  return WS_BASE_URL;
}

export function getAuthenticatedWebSocketUrl(token?: string) {
  const url = new URL(`${WS_BASE_URL}/ws`);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}
