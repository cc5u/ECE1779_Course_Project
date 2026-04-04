const MESSAGE_NOTIFICATIONS_KEY_PREFIX = "findit.notifications.messages";
const REPORT_NOTIFICATIONS_KEY_PREFIX = "findit.notifications.reports";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getScopedKey(prefix: string, userId: string) {
  return `${prefix}:${userId}`;
}

function readTimestamp(key: string) {
  const storage = getStorage();
  if (!storage) {
    return 0;
  }

  const rawValue = storage.getItem(key);
  if (!rawValue) {
    return 0;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeTimestamp(key: string, value: number) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, String(value));
}

export function getMessageNotificationsSeenAt(userId: string) {
  return readTimestamp(getScopedKey(MESSAGE_NOTIFICATIONS_KEY_PREFIX, userId));
}

export function markMessageNotificationsSeen(userId: string, timestamp = Date.now()) {
  writeTimestamp(getScopedKey(MESSAGE_NOTIFICATIONS_KEY_PREFIX, userId), timestamp);
}

export function getReportNotificationsSeenAt(userId: string) {
  return readTimestamp(getScopedKey(REPORT_NOTIFICATIONS_KEY_PREFIX, userId));
}

export function markReportNotificationsSeen(userId: string, timestamp = Date.now()) {
  writeTimestamp(getScopedKey(REPORT_NOTIFICATIONS_KEY_PREFIX, userId), timestamp);
}
