import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { ReportChatModal } from "../components/ReportChatModal";
import {
  formatApiError,
  getAuthenticatedWebSocketUrl,
  getMessageConversations,
  parseReportMessage,
  type LostReport,
  type MessageConversation,
  type ReportOwner,
} from "../lib/api";
import { useAuth } from "../lib/auth";

interface ChatContext {
  reportId: string;
  reportItemName: string;
  reportStatusLabel?: string;
  participant?: ReportOwner;
}

export default function Messages() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);

  useEffect(() => {
    void loadConversations();
  }, [session?.token, session?.user.id]);

  async function loadConversations(showLoading = true) {
    if (!session?.token) {
      return;
    }

    if (showLoading) {
      setIsLoadingConversations(true);
    }
    setErrorMessage("");

    try {
      const nextConversations = await getMessageConversations(session.user.id);
      setConversations(nextConversations);
    } catch (error) {
      setErrorMessage(formatApiError(error));
    } finally {
      if (showLoading) {
        setIsLoadingConversations(false);
      }
    }
  }

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const socket = new WebSocket(getAuthenticatedWebSocketUrl(session.token));
    const conversationReportIds = new Set(conversations.map((conversation) => conversation.reportId));

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "subscribe", channel: "reports" }));

      for (const reportId of conversationReportIds) {
        socket.send(JSON.stringify({ type: "subscribe", reportId }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          reportId?: string;
          data?: unknown;
          newStatus?: string;
        };

        const eventType = payload.type ?? "";
        const reportId = payload.reportId ?? "";
        const reportMessage =
          parseReportMessage(payload) ??
          parseReportMessage(payload.data);

        if (reportMessage) {
          void loadConversations(false);
          return;
        }

        if (
          eventType === "report_updated" ||
          eventType === "report_deleted" ||
          (reportId && conversationReportIds.has(reportId) && eventType === "status_change")
        ) {
          void loadConversations(false);
        }

        if (!reportId || chatContext?.reportId !== reportId) {
          return;
        }

        const nextStatus =
          typeof (payload.data as { status?: unknown } | undefined)?.status === "string"
            ? (payload.data as { status: string }).status
            : typeof (payload.data as { newStatus?: unknown } | undefined)?.newStatus === "string"
              ? (payload.data as { newStatus: string }).newStatus
              : typeof payload.newStatus === "string"
                ? payload.newStatus
                : "";

        if (nextStatus) {
          setChatContext((current) =>
            current && current.reportId === reportId
              ? { ...current, reportStatusLabel: getDisplayStatus(nextStatus as LostReport["status"]) }
              : current,
          );
        }
      } catch {
        // Ignore malformed websocket events.
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "unsubscribe", channel: "reports" }));

        for (const reportId of conversationReportIds) {
          socket.send(JSON.stringify({ type: "unsubscribe", reportId }));
        }
      }

      socket.close();
    };
  }, [chatContext?.reportId, conversations, session?.token]);

  function openChat({
    reportId,
    reportItemName,
    reportStatusLabel,
    participant,
  }: ChatContext) {
    setChatContext({
      reportId,
      reportItemName,
      reportStatusLabel,
      participant,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-16">
        <div className="mx-auto max-w-[1200px] px-8 py-12">
          <h1 className="text-3xl font-semibold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Open a conversation to see live updates for that report.</p>

          {errorMessage ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoadingConversations ? (
            <p className="mt-6 text-sm text-gray-500">Loading conversations...</p>
          ) : null}

          {!isLoadingConversations && !conversations.length ? (
            <p className="mt-6 text-sm text-gray-500">
              No conversations yet. Start one from a report or found-item submission.
            </p>
          ) : null}

          {!isLoadingConversations && conversations.length ? (
            <div className="mt-8 space-y-3">
              {conversations.map((conversation) => (
                <button
                  key={`${conversation.reportId}-${conversation.participant?.id ?? "unknown"}`}
                  type="button"
                  onClick={() =>
                    openChat({
                      reportId: conversation.reportId,
                      reportItemName: conversation.reportItemName,
                      reportStatusLabel: conversation.reportStatus ? getDisplayStatus(conversation.reportStatus) : undefined,
                      participant: conversation.participant,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{conversation.reportItemName}</p>
                        {conversation.reportStatus ? (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(conversation.reportStatus)}`}>
                            {getDisplayStatus(conversation.reportStatus)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600">
                        {conversation.participant ? `Participant: ${conversation.participant.displayName}` : "Participant unavailable"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {conversation.lastMessage?.messageText || "No messages yet."}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{conversation.lastMessage ? formatDateTime(conversation.lastMessage.createdAt) : "No timestamp"}</p>
                      {conversation.unreadCount ? (
                        <span className="mt-2 inline-flex rounded-full bg-blue-600 px-2 py-1 font-medium text-white">
                          {conversation.unreadCount} new
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </main>

      <ReportChatModal
        isOpen={chatContext !== null}
        reportId={chatContext?.reportId ?? null}
        reportItemName={chatContext?.reportItemName}
        reportStatusLabel={chatContext?.reportStatusLabel}
        participant={chatContext?.participant}
        currentUserId={session?.user.id ?? null}
        authToken={session?.token ?? null}
        onClose={() => setChatContext(null)}
      />
    </div>
  );
}

function getDisplayStatus(status: LostReport["status"]) {
  if (status === "possibly_found") {
    return "Possibly Found";
  }
  if (status === "found") {
    return "Found";
  }
  if (status === "archived") {
    return "Archived";
  }

  return "Lost";
}

function getStatusClassName(status: LostReport["status"]) {
  if (status === "possibly_found") {
    return "bg-green-50 text-green-700";
  }
  if (status === "found") {
    return "bg-blue-50 text-blue-700";
  }
  if (status === "archived") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-red-50 text-red-700";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}
