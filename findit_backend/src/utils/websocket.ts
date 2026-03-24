import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { parse } from "url";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  subscribedReports: Set<string>;
  isAlive: boolean;
}

// Track all connected clients
const clients = new Set<AuthenticatedSocket>();

// ─── Broadcast helpers ───────────────────────────────

/**
 * Send an event to all clients subscribed to a specific report
 */
export function broadcastToReport(reportId: string, event: object) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.subscribedReports.has(reportId) && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Send an event to a specific user (e.g., new message notification)
 */
export function sendToUser(userId: string, event: object) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// ─── Setup ───────────────────────────────────────────

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

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
            }
            break;

          case "unsubscribe":
            if (msg.reportId) {
              ws.subscribedReports.delete(msg.reportId);
              ws.send(JSON.stringify({ type: "unsubscribed", reportId: msg.reportId }));
            }
            break;

          default:
            ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
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
