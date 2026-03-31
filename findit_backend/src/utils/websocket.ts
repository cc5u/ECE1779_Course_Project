import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { parse } from "url";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const REDIS_URL = process.env.REDIS_URL?.trim();
export const REPORTS_CHANNEL = "reports";
const WS_EVENTS_CHANNEL = "findit:websocket-events";

type RedisClient = ReturnType<typeof createClient>;

type PublishedSocketEvent =
  | { target: { type: "report"; reportId: string }; event: object }
  | { target: { type: "report_except_user"; reportId: string; excludedUserId: string }; event: object }
  | { target: { type: "channel"; channel: string }; event: object }
  | { target: { type: "user"; userId: string }; event: object };

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  subscribedReports: Set<string>;
  subscribedChannels: Set<string>;
  activeTypingReports: Set<string>;
  isAlive: boolean;
}

// Track all connected clients
const clients = new Set<AuthenticatedSocket>();
let redisPublisher: RedisClient | null = null;
let redisSubscriber: RedisClient | null = null;

// ─── Broadcast helpers ───────────────────────────────

/**
 * Send an event to all clients subscribed to a specific report
 */
function dispatchToReport(reportId: string, payload: string) {
  for (const client of clients) {
    if (client.subscribedReports.has(reportId) && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function dispatchToReportExceptUser(reportId: string, excludedUserId: string, payload: string) {
  for (const client of clients) {
    if (client.userId === excludedUserId) {
      continue;
    }
    if (client.subscribedReports.has(reportId) && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Send an event to all clients subscribed to a named global channel.
 */
function dispatchToChannel(channel: string, payload: string) {
  for (const client of clients) {
    if (client.subscribedChannels.has(channel) && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function dispatchToUser(userId: string, payload: string) {
  for (const client of clients) {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function dispatchSocketEvent(envelope: PublishedSocketEvent) {
  const payload = JSON.stringify(envelope.event);

  switch (envelope.target.type) {
    case "report":
      dispatchToReport(envelope.target.reportId, payload);
      break;
    case "report_except_user":
      dispatchToReportExceptUser(envelope.target.reportId, envelope.target.excludedUserId, payload);
      break;
    case "channel":
      dispatchToChannel(envelope.target.channel, payload);
      break;
    case "user":
      dispatchToUser(envelope.target.userId, payload);
      break;
  }
}

async function publishSocketEvent(envelope: PublishedSocketEvent) {
  if (!redisPublisher || !redisSubscriber) {
    dispatchSocketEvent(envelope);
    return;
  }

  try {
    await redisPublisher.publish(WS_EVENTS_CHANNEL, JSON.stringify(envelope));
  } catch (error) {
    console.error("Failed to publish WebSocket event to Redis; falling back to local dispatch", error);
    dispatchSocketEvent(envelope);
  }
}

function queueSocketEvent(envelope: PublishedSocketEvent) {
  void publishSocketEvent(envelope);
}

export function broadcastToReport(reportId: string, event: object) {
  queueSocketEvent({
    target: { type: "report", reportId },
    event,
  });
}

function broadcastToReportExceptUser(reportId: string, excludedUserId: string, event: object) {
  queueSocketEvent({
    target: { type: "report_except_user", reportId, excludedUserId },
    event,
  });
}

export function broadcastToChannel(channel: string, event: object) {
  queueSocketEvent({
    target: { type: "channel", channel },
    event,
  });
}

/**
 * Send an event to clients subscribed to the global reports feed.
 */
export function broadcastToReports(event: object) {
  broadcastToChannel(REPORTS_CHANNEL, event);
}

/**
 * Send an event to a specific user (e.g., new message notification)
 */
export function sendToUser(userId: string, event: object) {
  queueSocketEvent({
    target: { type: "user", userId },
    event,
  });
}

export async function initializeWebSocketPubSub() {
  if (!REDIS_URL || redisPublisher || redisSubscriber) {
    return;
  }

  const publisher = createClient({ url: REDIS_URL });
  const subscriber = publisher.duplicate();

  publisher.on("error", (error) => {
    console.error("Redis publisher error:", error);
  });
  subscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
  });

  try {
    await publisher.connect();
    await subscriber.connect();
    await subscriber.subscribe(WS_EVENTS_CHANNEL, (message) => {
      try {
        dispatchSocketEvent(JSON.parse(message) as PublishedSocketEvent);
      } catch (error) {
        console.error("Failed to process WebSocket event from Redis:", error);
      }
    });

    redisPublisher = publisher;
    redisSubscriber = subscriber;
  } catch (error) {
    await Promise.allSettled([publisher.quit(), subscriber.quit()]);
    throw error;
  }
}

export async function closeWebSocketPubSub() {
  const publisher = redisPublisher;
  const subscriber = redisSubscriber;
  redisPublisher = null;
  redisSubscriber = null;

  await Promise.allSettled([
    subscriber ? subscriber.unsubscribe(WS_EVENTS_CHANNEL) : Promise.resolve(),
    subscriber ? subscriber.quit() : Promise.resolve(),
    publisher ? publisher.quit() : Promise.resolve(),
  ]);
}

export function getRealtimeTransportMode() {
  return redisPublisher && redisSubscriber ? "redis" : "local";
}

// ─── Setup ───────────────────────────────────────────

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  function stopTyping(ws: AuthenticatedSocket, reportId: string) {
    if (!ws.userId || !ws.activeTypingReports.has(reportId)) {
      return;
    }

    ws.activeTypingReports.delete(reportId);
    broadcastToReportExceptUser(reportId, ws.userId, {
      type: "typing_stop",
      reportId,
      userId: ws.userId,
    });
  }

  // Heartbeat to detect disconnected clients
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        clients.delete(client);
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws: AuthenticatedSocket, req) => {
    ws.subscribedReports = new Set();
    ws.subscribedChannels = new Set();
    ws.activeTypingReports = new Set();
    ws.isAlive = true;
    clients.add(ws);

    // Try to authenticate via query param token
    try {
      const { query } = parse(req.url || "", true);
      if (query.token) {
        const decoded = jwt.verify(query.token as string, JWT_SECRET) as { id: string };
        ws.userId = decoded.id;
      }
    } catch {
      // Unauthenticated connection — still allow read-only subscriptions
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case "subscribe":
            // Subscribe to a report's real-time updates
            if (msg.reportId && typeof msg.reportId === "string") {
              ws.subscribedReports.add(msg.reportId);
              ws.send(JSON.stringify({ type: "subscribed", reportId: msg.reportId }));
            } else if (msg.channel === REPORTS_CHANNEL) {
              ws.subscribedChannels.add(REPORTS_CHANNEL);
              ws.send(JSON.stringify({ type: "subscribed", channel: REPORTS_CHANNEL }));
            } else {
              ws.send(JSON.stringify({ type: "error", message: "Missing or invalid subscription target" }));
            }
            break;

          case "unsubscribe":
            if (msg.reportId) {
              stopTyping(ws, msg.reportId);
              ws.subscribedReports.delete(msg.reportId);
              ws.send(JSON.stringify({ type: "unsubscribed", reportId: msg.reportId }));
            } else if (msg.channel === REPORTS_CHANNEL) {
              ws.subscribedChannels.delete(REPORTS_CHANNEL);
              ws.send(JSON.stringify({ type: "unsubscribed", channel: REPORTS_CHANNEL }));
            } else {
              ws.send(JSON.stringify({ type: "error", message: "Missing or invalid unsubscription target" }));
            }
            break;

          case "typing_start":
            if (!ws.userId) {
              ws.send(JSON.stringify({ type: "error", message: "Authentication required for typing indicators" }));
              break;
            }
            if (!msg.reportId || typeof msg.reportId !== "string") {
              ws.send(JSON.stringify({ type: "error", message: "Missing or invalid reportId for typing_start" }));
              break;
            }
            if (!ws.subscribedReports.has(msg.reportId)) {
              ws.send(JSON.stringify({ type: "error", message: "Subscribe to the report before sending typing_start" }));
              break;
            }
            if (!ws.activeTypingReports.has(msg.reportId)) {
              ws.activeTypingReports.add(msg.reportId);
              broadcastToReportExceptUser(msg.reportId, ws.userId, {
                type: "typing_start",
                reportId: msg.reportId,
                userId: ws.userId,
              });
            }
            break;

          case "typing_stop":
            if (!ws.userId) {
              ws.send(JSON.stringify({ type: "error", message: "Authentication required for typing indicators" }));
              break;
            }
            if (!msg.reportId || typeof msg.reportId !== "string") {
              ws.send(JSON.stringify({ type: "error", message: "Missing or invalid reportId for typing_stop" }));
              break;
            }
            stopTyping(ws, msg.reportId);
            break;

          default:
            ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      for (const reportId of Array.from(ws.activeTypingReports)) {
        stopTyping(ws, reportId);
      }
      clients.delete(ws);
    });

    // Welcome message
    ws.send(
      JSON.stringify({
        type: "connected",
        authenticated: !!ws.userId,
        message: "Connected to UofT Lost & Found real-time updates",
      })
    );
  });

  console.log("WebSocket server attached at /ws");
  return wss;
}
