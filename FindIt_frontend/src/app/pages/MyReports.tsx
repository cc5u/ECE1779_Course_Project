import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Trash2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ReportChatModal } from "../components/ReportChatModal";
import { StatusConfirmationModal } from "../components/StatusConfirmationModal";
import {
  deleteReport,
  formatApiError,
  getAuthenticatedWebSocketUrl,
  getMyReports,
  getSightings,
  updateReportStatus,
  type LostReport,
  type ReportOwner,
  type Sighting,
} from "../lib/api";
import { useAuth } from "../lib/auth";

type OwnerAction =
  | { type: "delete"; report: LostReport }
  | { type: "mark_found"; report: LostReport };

interface ChatContext {
  reportId: string;
  reportItemName: string;
  reportStatusLabel?: string;
  participant?: ReportOwner;
}

export default function MyReports() {
  const { session } = useAuth();
  const [myReports, setMyReports] = useState<LostReport[]>([]);
  const [reportSightings, setReportSightings] = useState<Record<string, Sighting[]>>({});
  const [reportsError, setReportsError] = useState("");
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [pendingOwnerAction, setPendingOwnerAction] = useState<OwnerAction | null>(null);
  const [isSubmittingOwnerAction, setIsSubmittingOwnerAction] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);

  useEffect(() => {
    void loadOwnerReports();
  }, [session?.token]);

  async function loadOwnerReports(showLoading = true) {
    if (!session?.token) {
      return;
    }

    if (showLoading) {
      setIsLoadingReports(true);
    }
    setReportsError("");

    try {
      const reports = await getMyReports();
      setMyReports(reports);

      const sightingsEntries = await Promise.all(
        reports.map(async (report) => [report.id, await getSightings(report.id)] as const),
      );

      setReportSightings(Object.fromEntries(sightingsEntries));
    } catch (error) {
      setReportsError(formatApiError(error));
    } finally {
      if (showLoading) {
        setIsLoadingReports(false);
      }
    }
  }

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const socket = new WebSocket(getAuthenticatedWebSocketUrl(session.token));
    const ownerReportIds = new Set(myReports.map((report) => report.id));

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "subscribe", channel: "reports" }));

      for (const reportId of ownerReportIds) {
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

        if (
          eventType === "report_created" ||
          eventType === "report_updated" ||
          eventType === "report_deleted"
        ) {
          void loadOwnerReports(false);
        }

        if (reportId && ownerReportIds.has(reportId) && (eventType === "new_sighting" || eventType === "status_change")) {
          void loadOwnerReports(false);
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

        for (const reportId of ownerReportIds) {
          socket.send(JSON.stringify({ type: "unsubscribe", reportId }));
        }
      }

      socket.close();
    };
  }, [chatContext?.reportId, myReports, session?.token]);

  async function handleOwnerActionConfirm() {
    if (!pendingOwnerAction) {
      return;
    }

    setIsSubmittingOwnerAction(true);
    setReportsError("");

    try {
      if (pendingOwnerAction.type === "delete") {
        await deleteReport(pendingOwnerAction.report.id);
      } else {
        await updateReportStatus(pendingOwnerAction.report.id, "found");
      }

      setPendingOwnerAction(null);
      await loadOwnerReports();
    } catch (error) {
      setReportsError(formatApiError(error));
    } finally {
      setIsSubmittingOwnerAction(false);
    }
  }

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
          <h1 className="text-3xl font-semibold text-gray-900">My Reports</h1>
          <p className="mt-2 text-gray-600">
            Review found-item submissions for your reports and manage their final status.
          </p>

          {reportsError ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {reportsError}
            </div>
          ) : null}

          {isLoadingReports ? (
            <p className="mt-6 text-sm text-gray-500">Loading your reports...</p>
          ) : null}

          {!isLoadingReports && !myReports.length ? (
            <p className="mt-6 text-sm text-gray-500">You have not created any lost-item reports yet.</p>
          ) : null}

          {!isLoadingReports && myReports.length ? (
            <div className="mt-8 space-y-6">
              {myReports.map((report) => {
                const sightings = reportSightings[report.id] ?? [];

                return (
                  <div key={report.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-gray-900">{report.itemName}</h2>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(report.status)}`}>
                            {getDisplayStatus(report.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{report.description}</p>
                        <p className="text-sm text-gray-500">{report.lostLocationText || "Location unavailable"}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {report.status !== "found" && report.status !== "archived" ? (
                          <button
                            type="button"
                            onClick={() => setPendingOwnerAction({ type: "mark_found", report })}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Found
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setPendingOwnerAction({ type: "delete", report })}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Found Item Reports</h3>
                        <span className="text-xs text-gray-500">
                          {sightings.length} submission{sightings.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {sightings.length ? (
                        <div className="space-y-3">
                          {sightings.map((sighting) => (
                            <div key={sighting.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {sighting.finder?.displayName || "Finder"}
                                  </p>
                                  <p className="text-xs text-gray-500">{formatDateTime(sighting.createdAt)}</p>
                                </div>
                                {sighting.finder?.id ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openChat({
                                        reportId: report.id,
                                        reportItemName: report.itemName,
                                        reportStatusLabel: getDisplayStatus(report.status),
                                        participant: sighting.finder,
                                      })
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-white"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    Message Finder
                                  </button>
                                ) : null}
                              </div>

                              <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                                {sighting.note || "No details provided."}
                              </p>

                              {sighting.images?.length ? (
                                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                                  {sighting.images.map((image) => (
                                    <img
                                      key={image.id}
                                      src={image.publicUrl}
                                      alt="Found item report"
                                      className="h-28 w-full rounded-lg object-cover"
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No one has submitted a found-item report for this item yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>

      <StatusConfirmationModal
        isOpen={pendingOwnerAction !== null}
        title={pendingOwnerAction?.type === "delete" ? "Delete Report" : "Mark Item as Found"}
        message={
          pendingOwnerAction?.type === "delete"
            ? "Delete this report permanently? This will also remove its found-item submissions."
            : "Mark this report as found? Finders will still only be able to submit sightings to other active reports."
        }
        confirmLabel={pendingOwnerAction?.type === "delete" ? "Delete Report" : "Mark Found"}
        confirmButtonClassName={
          pendingOwnerAction?.type === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }
        isConfirming={isSubmittingOwnerAction}
        onClose={() => {
          if (!isSubmittingOwnerAction) {
            setPendingOwnerAction(null);
          }
        }}
        onConfirm={handleOwnerActionConfirm}
      />
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
