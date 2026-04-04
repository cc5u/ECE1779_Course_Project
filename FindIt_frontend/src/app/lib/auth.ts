import { useSyncExternalStore } from "react";

export interface AuthUser {
  id: string;
  uoftEmail: string;
  displayName: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const SESSION_STORAGE_KEY = "findit.auth.session";
const AUTH_CHANGE_EVENT = "findit:auth-change";

let currentRawSession: string | null = null;
let currentSession: AuthSession | null = null;

function getAuthStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<AuthUser>;
  return (
    typeof user.id === "string" &&
    typeof user.uoftEmail === "string" &&
    typeof user.displayName === "string"
  );
}

function normalizeSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const session = value as Partial<AuthSession>;
  if (typeof session.token !== "string" || !session.token.trim() || !isAuthUser(session.user)) {
    return null;
  }

  return {
    token: session.token,
    user: {
      id: session.user.id,
      uoftEmail: session.user.uoftEmail,
      displayName: session.user.displayName,
      createdAt: session.user.createdAt,
    },
  };
}

function clearCachedSession() {
  currentRawSession = null;
  currentSession = null;
}

function syncSessionFromStorage() {
  const storage = getAuthStorage();

  if (!storage) {
    clearCachedSession();
    return null;
  }

  const nextRawSession = storage.getItem(SESSION_STORAGE_KEY);

  if (nextRawSession === currentRawSession) {
    return currentSession;
  }

  currentRawSession = nextRawSession;

  if (!nextRawSession) {
    currentSession = null;
    return null;
  }

  try {
    const parsedSession = normalizeSession(JSON.parse(nextRawSession));

    if (!parsedSession) {
      throw new Error("Invalid auth session");
    }

    currentSession = parsedSession;
    return currentSession;
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    clearCachedSession();
    return null;
  }
}

function emitAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function subscribeToSession(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleSessionChange = () => {
    syncSessionFromStorage();
    callback();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SESSION_STORAGE_KEY) {
      return;
    }

    handleSessionChange();
  };

  window.addEventListener(AUTH_CHANGE_EVENT, handleSessionChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handleSessionChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getStoredSession(): AuthSession | null {
  return syncSessionFromStorage();
}

export function saveSession(session: AuthSession) {
  const normalizedSession = normalizeSession(session);
  const storage = getAuthStorage();

  if (!normalizedSession) {
    throw new Error("Cannot save an invalid auth session.");
  }

  if (!storage) {
    throw new Error("Local storage is unavailable.");
  }

  const serializedSession = JSON.stringify(normalizedSession);
  storage.setItem(SESSION_STORAGE_KEY, serializedSession);
  currentRawSession = serializedSession;
  currentSession = normalizedSession;
  emitAuthChange();
}

export function clearSession() {
  const storage = getAuthStorage();

  storage?.removeItem(SESSION_STORAGE_KEY);
  clearCachedSession();
  emitAuthChange();
}

export function useAuthSession() {
  return useSyncExternalStore(subscribeToSession, getStoredSession, () => null);
}

export function useAuth() {
  const session = useAuthSession();

  return {
    session,
    isAuthenticated: Boolean(session?.token),
    saveSession,
    clearSession,
  };
}
