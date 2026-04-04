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

function syncSessionFromStorage() {
  if (typeof window === "undefined") {
    currentRawSession = null;
    currentSession = null;
    return null;
  }

  const nextRawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (nextRawSession === currentRawSession) {
    return currentSession;
  }

  currentRawSession = nextRawSession;

  if (!nextRawSession) {
    currentSession = null;
    return null;
  }

  try {
    currentSession = JSON.parse(nextRawSession) as AuthSession;
    return currentSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    currentRawSession = null;
    currentSession = null;
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
  const serializedSession = JSON.stringify(session);
  currentRawSession = serializedSession;
  currentSession = session;
  window.localStorage.setItem(SESSION_STORAGE_KEY, serializedSession);
  emitAuthChange();
}

export function clearSession() {
  currentRawSession = null;
  currentSession = null;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
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
