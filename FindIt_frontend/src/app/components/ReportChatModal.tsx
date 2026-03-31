import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Send, Wifi, WifiOff, X } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import {
  formatApiError,
  getAuthenticatedWebSocketUrl,
  getReportMessages,
  parsePresenceUpdate,
  parseReportMessage,
  sendReportMessage,
  type ReportMessage,
  type ReportOwner,
} from "../lib/api";

interface ReportChatModalProps {
  isOpen: boolean;
  reportId: string | null;
  reportItemName?: string;
  reportStatusLabel?: string;
  participant?: ReportOwner;
  currentUserId?: string | null;
  authToken?: string | null;
  onClose: () => void;
}

function isConversationMessage(message: ReportMessage, currentUserId: string, participantId?: string) {
  if (!participantId) {
    return true;
  }

  const senderMatches = message.senderId === currentUserId && message.receiverId === participantId;
  const receiverMatches = message.senderId === participantId && message.receiverId === currentUserId;
  return senderMatches || receiverMatches;
}

function dedupeMessages(messages: ReportMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) {
      return false;
    }
    seen.add(message.id);
    return true;
  });
}

function inferConversationParticipant(
  messages: ReportMessage[],
  currentUserId?: string | null,
): ReportOwner | undefined {
  if (!currentUserId) {
    return undefined;
  }

  const orderedMessages = [...messages].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  for (const message of orderedMessages) {
    if (message.senderId === currentUserId) {
      return message.receiver ?? { id: message.receiverId, displayName: "Conversation participant" };
    }

    if (message.receiverId === currentUserId) {
      return message.sender ?? { id: message.senderId, displayName: "Conversation participant" };
    }
  }

  return undefined;
}

export function ReportChatModal({
  isOpen,
  reportId,
  reportItemName = "Lost item report",
  reportStatusLabel,
  participant,
  currentUserId,
  authToken,
  onClose,
}: ReportChatModalProps) {
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const [isBrowserOnline, setIsBrowserOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [participantPresence, setParticipantPresence] = useState<"online" | "offline" | "unknown">("unknown");
  const [liveStatusNote, setLiveStatusNote] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const resolvedParticipant = participant ?? inferConversationParticipant(messages, currentUserId);
  const participantId = resolvedParticipant?.id;
  const canMessage = Boolean(isOpen && reportId && participantId && currentUserId && authToken);
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        currentUserId ? isConversationMessage(message, currentUserId, participantId) : true,
      ),
    [currentUserId, messages, participantId],
  );

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setDraft("");
      setErrorMessage("");
      setLiveStatusNote("");
      setConnectionState("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!participantId) {
      setParticipantPresence("unknown");
    }
  }, [participantId]);

  useEffect(() => {
    if (!isOpen || !reportId || !currentUserId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setErrorMessage("");

    void getReportMessages(reportId)
      .then((responseMessages) => {
        if (!isActive) {
          return;
        }

        setMessages(
          dedupeMessages(
            responseMessages.filter((message) => isConversationMessage(message, currentUserId, participantId)),
          ),
        );
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(formatApiError(error));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentUserId, isOpen, participantId, reportId]);

  useEffect(() => {
    if (!canMessage || !reportId || !authToken) {
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      setConnectionState("connecting");
      const socket = new WebSocket(getAuthenticatedWebSocketUrl(authToken));
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }

        setConnectionState("connected");
        socket.send(JSON.stringify({ type: "subscribe", reportId }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            message?: unknown;
            data?: unknown;
            reportId?: string;
            status?: string;
          };

          const realtimeMessage =
            parseReportMessage(payload.message) ??
            parseReportMessage(payload.data) ??
            parseReportMessage(payload);

          if (realtimeMessage && realtimeMessage.reportId === reportId) {
            if (currentUserId && !isConversationMessage(realtimeMessage, currentUserId, participantId)) {
              return;
            }

            setMessages((current) =>
              dedupeMessages([...current, realtimeMessage]).sort(
                (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
              ),
            );
            return;
          }

          const presenceUpdate =
            parsePresenceUpdate(payload) ??
            parsePresenceUpdate(payload.data) ??
            parsePresenceUpdate(payload.message);

          if (presenceUpdate && presenceUpdate.userId === participantId) {
            setParticipantPresence(presenceUpdate.online ? "online" : "offline");
            return;
          }

          const statusType = payload.type?.toLowerCase() ?? "";
          const statusReportId =
            payload.reportId ??
            (payload.data && typeof payload.data === "object" && "reportId" in payload.data
              ? String((payload.data as { reportId?: string }).reportId ?? "")
              : "");
          const nextStatus =
            payload.status ??
            (payload.data && typeof payload.data === "object" && "status" in payload.data
              ? String((payload.data as { status?: string }).status ?? "")
              : "");

          if (
            statusReportId === reportId &&
            (statusType.includes("status") || statusType.includes("report"))
          ) {
            setLiveStatusNote(nextStatus ? `Report updated: ${nextStatus.replace(/_/g, " ")}` : "Report updated.");
          }
        } catch {
          // Ignore malformed WebSocket events.
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }

        setConnectionState("disconnected");
        reconnectTimerRef.current = window.setTimeout(connect, 2500);
      };

      socket.onerror = () => {
        setConnectionState("disconnected");
      };
    };

    connect();

    return () => {
      cancelled = true;

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "unsubscribe", reportId }));
      }
      socket?.close();
      socketRef.current = null;
    };
  }, [authToken, canMessage, currentUserId, participantId, reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  const handleSend = async () => {
    if (!reportId || !participantId) {
      setErrorMessage("Choose a conversation participant before sending a message.");
      return;
    }

    const messageText = draft.trim();
    if (!messageText) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");

    try {
      const message = await sendReportMessage(reportId, {
        receiverId: participantId,
        messageText,
      });

      setMessages((current) =>
        dedupeMessages([...current, message]).sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        ),
      );
      setDraft("");
    } catch (error) {
      setErrorMessage(formatApiError(error));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const connectionLabel = !isBrowserOnline
    ? "Offline"
    : connectionState === "connected"
      ? "Connected"
      : connectionState === "connecting"
        ? "Connecting"
        : connectionState === "disconnected"
          ? "Reconnecting"
          : "Offline";
  const participantStatus =
    participantPresence !== "unknown"
      ? participantPresence
      : connectionState === "connected" && isBrowserOnline
        ? "online"
        : "offline";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex h-[min(720px,90vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {reportItemName}
              </span>
              {reportStatusLabel ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {reportStatusLabel}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{resolvedParticipant ? `Chatting with ${resolvedParticipant.displayName}` : "Choose a participant to start chatting."}</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    participantStatus === "online" ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {participantStatus === "online" ? "Online" : "Offline"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {connectionState === "connected" && isBrowserOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
                {connectionLabel}
              </span>
            </div>
            {liveStatusNote ? <p className="text-xs text-gray-500">{liveStatusNote}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-5">
          {errorMessage ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading messages...
            </div>
          ) : visibleMessages.length ? (
            visibleMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.messageText}
                timestamp={formatMessageTime(message.createdAt)}
                isSender={message.senderId === currentUserId}
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="max-w-sm text-center text-sm text-gray-500">
                No messages yet. Start the conversation to coordinate the handoff.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex gap-3">
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={resolvedParticipant ? `Message ${resolvedParticipant.displayName}` : "Select a conversation to start messaging"}
              disabled={!participantId || isSending}
              className="min-h-[88px] flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!participantId || isSending || !draft.trim()}
              className="inline-flex w-28 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
