import { useEffect, useRef, useState } from "react";
import { ClipboardList, MapPin, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router";
import {
    getAuthenticatedWebSocketUrl,
    getMessageConversations,
    getMyReports,
    getSightings,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import {
    getMessageNotificationsSeenAt,
    getReportNotificationsSeenAt,
    markMessageNotificationsSeen,
    markReportNotificationsSeen,
} from "../lib/notifications";
import { ProfileDropdown } from "./ProfileDropdown";

export function Navbar() {
    const location = useLocation();
    const { isAuthenticated, session } = useAuth();
    const isHomePage = location.pathname === "/home";
    const isCreateReportPage = location.pathname === "/report";
    const isReportsPage = location.pathname === "/reports";
    const isMessagesPage = location.pathname === "/messages";
    const currentUserId = session?.user.id ?? null;
    const [messageNotificationCount, setMessageNotificationCount] = useState(0);
    const [reportNotificationCount, setReportNotificationCount] = useState(0);
    const [ownerReportIds, setOwnerReportIds] = useState<string[]>([]);
    const ownerReportIdsRef = useRef<string[]>([]);

    useEffect(() => {
        ownerReportIdsRef.current = ownerReportIds;
    }, [ownerReportIds]);

    useEffect(() => {
        if (!currentUserId) {
            setMessageNotificationCount(0);
            setReportNotificationCount(0);
            setOwnerReportIds([]);
            return;
        }

        if (isMessagesPage) {
            markMessageNotificationsSeen(currentUserId);
        }

        if (isReportsPage) {
            markReportNotificationsSeen(currentUserId);
        }
    }, [currentUserId, isMessagesPage, isReportsPage]);

    useEffect(() => {
        if (!session?.token || !currentUserId) {
            return;
        }

        const userId = currentUserId;
        let isActive = true;

        async function loadNotificationCounts() {
            const timestamp = Date.now();

            if (isMessagesPage) {
                markMessageNotificationsSeen(userId, timestamp);
            }

            if (isReportsPage) {
                markReportNotificationsSeen(userId, timestamp);
            }

            try {
                const [conversations, reports] = await Promise.all([
                    getMessageConversations(userId),
                    getMyReports(),
                ]);

                if (!isActive) {
                    return;
                }

                const nextOwnerReportIds = reports.map((report) => report.id);
                setOwnerReportIds(nextOwnerReportIds);

                const messageSeenAt = getMessageNotificationsSeenAt(userId);
                const reportSeenAt = getReportNotificationsSeenAt(userId);

                const nextMessageNotificationCount = isMessagesPage
                    ? 0
                    : conversations.filter((conversation) => {
                        if (!conversation.lastMessage) {
                            return false;
                        }

                        const createdAt = new Date(conversation.lastMessage.createdAt).getTime();
                            return (
                                Number.isFinite(createdAt) &&
                                conversation.lastMessage.receiverId === userId &&
                                createdAt > messageSeenAt
                            );
                    }).length;

                const sightingsByReport = await Promise.all(
                    reports.map(async (report) => getSightings(report.id)),
                );

                if (!isActive) {
                    return;
                }

                const nextReportNotificationCount = isReportsPage
                    ? 0
                    : sightingsByReport.flat().filter((sighting) => {
                        const createdAt = new Date(sighting.createdAt).getTime();
                        return Number.isFinite(createdAt) && createdAt > reportSeenAt;
                    }).length;

                setMessageNotificationCount(nextMessageNotificationCount);
                setReportNotificationCount(nextReportNotificationCount);
            } catch {
                if (!isActive) {
                    return;
                }

                setMessageNotificationCount(0);
                setReportNotificationCount(0);
                setOwnerReportIds([]);
            }
        }

        void loadNotificationCounts();

        return () => {
            isActive = false;
        };
    }, [currentUserId, isMessagesPage, isReportsPage, session?.token]);

    useEffect(() => {
        if (!session?.token || !currentUserId) {
            return;
        }

        const userId = currentUserId;
        let cancelled = false;
        const socket = new WebSocket(getAuthenticatedWebSocketUrl(session.token));

        async function refreshMessageNotificationCount() {
            const timestamp = Date.now();

            if (isMessagesPage) {
                markMessageNotificationsSeen(userId, timestamp);
            }

            try {
                const conversations = await getMessageConversations(userId);

                if (cancelled) {
                    return;
                }

                const messageSeenAt = getMessageNotificationsSeenAt(userId);
                setMessageNotificationCount(
                    isMessagesPage
                        ? 0
                        : conversations.filter((conversation) => {
                            if (!conversation.lastMessage) {
                                return false;
                            }

                            const createdAt = new Date(conversation.lastMessage.createdAt).getTime();
                            return (
                                Number.isFinite(createdAt) &&
                                conversation.lastMessage.receiverId === userId &&
                                createdAt > messageSeenAt
                            );
                        }).length,
                );
            } catch {
                if (!cancelled) {
                    setMessageNotificationCount(0);
                }
            }
        }

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "subscribe", channel: "reports" }));

            for (const reportId of ownerReportIds) {
                socket.send(JSON.stringify({ type: "subscribe", reportId }));
            }
        };

        socket.onmessage = (event) => {
            if (cancelled) {
                return;
            }

            try {
                const payload = JSON.parse(event.data) as {
                    type?: string;
                    reportId?: string;
                    data?: unknown;
                };
                const eventType = payload.type ?? "";
                const reportId = typeof payload.reportId === "string" ? payload.reportId : "";
                const payloadData = payload.data && typeof payload.data === "object"
                    ? payload.data as {
                        createdAt?: string;
                        owner?: {
                            id?: string;
                        };
                    }
                    : null;

                if (
                    eventType !== "new_message" &&
                    eventType !== "new_message_notification" &&
                    eventType !== "new_sighting" &&
                    eventType !== "report_created" &&
                    eventType !== "report_deleted"
                ) {
                    return;
                }

                if (eventType === "report_created" && reportId && payloadData?.owner?.id === userId) {
                    if (!ownerReportIdsRef.current.includes(reportId)) {
                        ownerReportIdsRef.current = [...ownerReportIdsRef.current, reportId];
                        setOwnerReportIds(ownerReportIdsRef.current);
                    }

                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: "subscribe", reportId }));
                    }
                    return;
                }

                if (eventType === "report_deleted" && reportId && ownerReportIdsRef.current.includes(reportId)) {
                    ownerReportIdsRef.current = ownerReportIdsRef.current.filter((id) => id !== reportId);
                    setOwnerReportIds(ownerReportIdsRef.current);

                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: "unsubscribe", reportId }));
                    }
                    return;
                }

                if (eventType === "new_sighting" && reportId && ownerReportIdsRef.current.includes(reportId)) {
                    const createdAt = payloadData?.createdAt ? new Date(payloadData.createdAt).getTime() : Date.now();
                    const reportSeenAt = getReportNotificationsSeenAt(userId);

                    if (isReportsPage) {
                        markReportNotificationsSeen(userId, Date.now());
                        setReportNotificationCount(0);
                    } else if (!Number.isFinite(createdAt) || createdAt > reportSeenAt) {
                        setReportNotificationCount((current) => current + 1);
                    }
                    return;
                }
            } catch {
                return;
            }

            void refreshMessageNotificationCount();
        };

        return () => {
            cancelled = true;

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "unsubscribe", channel: "reports" }));

                for (const reportId of ownerReportIds) {
                    socket.send(JSON.stringify({ type: "unsubscribe", reportId }));
                }
            }

            socket.close();
        };
    }, [currentUserId, isMessagesPage, isReportsPage, ownerReportIds, session?.token]);

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">FindIt</span>
            </Link>
        
            <div className="flex items-center gap-3">
            <Link to="/home" className={`px-4 py-2 font-medium transition-colors ${
                isHomePage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
                Home
            </Link>
            {isAuthenticated ? (
                <>
                    <Link
                        to="/reports"
                        className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            isReportsPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        My Reports
                        {reportNotificationCount ? (
                            <NotificationBadge count={reportNotificationCount} />
                        ) : null}
                    </Link>
                    <Link
                        to="/messages"
                        className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            isMessagesPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                        {messageNotificationCount ? (
                            <NotificationBadge count={messageNotificationCount} />
                        ) : null}
                    </Link>
                </>
            ) : null}
            <Link 
                to="/report" 
                className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                isCreateReportPage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                Report Lost Item
            </Link>
            {isAuthenticated ? (
                <ProfileDropdown />
            ) : (
                <>
                    <Link
                        to="/login"
                        className="px-4 py-2 font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Create Account
                    </Link>
                </>
            )}
            </div>
        </div>
        </nav>
    );
}

function NotificationBadge({ count }: { count: number }) {
    return (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {count > 9 ? "9+" : count}
        </span>
    );
}
