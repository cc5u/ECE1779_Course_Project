import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { User, Lock, Bell, Trash2, Save, CheckCircle2, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { ReportChatModal } from '../components/ReportChatModal';
import { StatusConfirmationModal } from '../components/StatusConfirmationModal';
import {
    deleteReport,
    formatApiError,
    getAuthenticatedWebSocketUrl,
    getMessageConversations,
    getMyReports,
    getProfile,
    getSightings,
    parseReportMessage,
    updateReportStatus,
    type LostReport,
    type MessageConversation,
    type ReportOwner,
    type Sighting,
} from '../lib/api';
import { getStoredSession } from '../lib/auth';

export default function Settings() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'profile' | 'reports' | 'messages' | 'password' | 'notifications' | 'account'>('profile');
    
    // Profile state
    const [profile, setProfile] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
    });
    
    // Password state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    
    // Notifications state
    const [notifications, setNotifications] = useState({
        emailMatches: true,
        emailMessages: true,
        emailUpdates: false,
        smsMatches: true,
        smsMessages: false,
    });
    
    const [saveMessage, setSaveMessage] = useState('');
    const [myReports, setMyReports] = useState<LostReport[]>([]);
    const [reportSightings, setReportSightings] = useState<Record<string, Sighting[]>>({});
    const [conversations, setConversations] = useState<MessageConversation[]>([]);
    const [reportsError, setReportsError] = useState('');
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [pendingOwnerAction, setPendingOwnerAction] = useState<
        | { type: 'delete'; report: LostReport }
        | { type: 'mark_found'; report: LostReport }
        | null
    >(null);
    const [isSubmittingOwnerAction, setIsSubmittingOwnerAction] = useState(false);
    const [chatContext, setChatContext] = useState<{
        reportId: string;
        reportItemName: string;
        reportStatusLabel?: string;
        participant?: ReportOwner;
    } | null>(null);
    const session = getStoredSession();
    const requestedTab = searchParams.get('tab');
    const isStandaloneTab = activeTab === 'reports' || activeTab === 'messages';

    useEffect(() => {
        const allowedTabs = new Set(['profile', 'reports', 'messages', 'password', 'notifications', 'account']);
        const nextTab = requestedTab && allowedTabs.has(requestedTab) ? requestedTab as typeof activeTab : 'profile';
        setActiveTab(nextTab);
    }, [requestedTab]);

    const changeTab = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setSearchParams(tab === 'profile' ? {} : { tab });
    };

    useEffect(() => {
        async function loadProfile() {
            if (!session?.token) {
                return;
            }

            try {
                const user = await getProfile();
                const nameParts = user.displayName.split(' ');
                setProfile((current) => ({
                    ...current,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' '),
                    email: user.uoftEmail,
                }));
            } catch {
                // Keep the existing placeholder state if the profile request fails.
            }
        }

        void loadProfile();
    }, [session?.token]);

    useEffect(() => {
        void loadOwnerReports();
    }, [session?.token]);

    useEffect(() => {
        void loadConversations();
    }, [session?.token]);

    const handleProfileSave = () => {
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handlePasswordChange = () => {
        if (passwords.new !== passwords.confirm) {
        setSaveMessage('New passwords do not match!');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
        }
        setSaveMessage('Password changed successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleNotificationsSave = () => {
        setSaveMessage('Notification preferences saved!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const loadOwnerReports = async (showLoading = true) => {
        if (!session?.token) {
            return;
        }

        if (showLoading) {
            setIsLoadingReports(true);
        }
        setReportsError('');

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
    };

    const loadConversations = async (showLoading = true) => {
        if (!session?.token) {
            return;
        }

        if (showLoading) {
            setIsLoadingConversations(true);
        }

        try {
            const nextConversations = await getMessageConversations(session.user.id);
            setConversations(nextConversations);
        } catch {
            // Keep the rest of the settings page usable if conversations fail to load.
        } finally {
            if (showLoading) {
                setIsLoadingConversations(false);
            }
        }
    };

    const refreshOwnerReports = async () => {
        await loadOwnerReports();
    };

    const openChat = ({
        reportId,
        reportItemName,
        reportStatusLabel,
        participant,
    }: {
        reportId: string;
        reportItemName: string;
        reportStatusLabel?: string;
        participant?: ReportOwner;
    }) => {
        setChatContext({
            reportId,
            reportItemName,
            reportStatusLabel,
            participant,
        });
    };

    useEffect(() => {
        if (!session?.token) {
            return;
        }

        const socket = new WebSocket(getAuthenticatedWebSocketUrl(session.token));
        const ownerReportIds = new Set(myReports.map((report) => report.id));

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'subscribe', channel: 'reports' }));

            for (const reportId of ownerReportIds) {
                socket.send(JSON.stringify({ type: 'subscribe', reportId }));
            }
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as {
                    type?: string;
                    reportId?: string;
                    data?: unknown;
                    message?: unknown;
                };

                const eventType = payload.type ?? '';
                const reportId = payload.reportId ?? '';
                const reportMessage =
                    parseReportMessage(payload.message) ??
                    parseReportMessage(payload.data) ??
                    parseReportMessage(payload);

                if (reportMessage) {
                    void loadConversations(false);
                    return;
                }

                if (
                    eventType === 'report_created' ||
                    eventType === 'report_updated' ||
                    eventType === 'report_deleted'
                ) {
                    void loadOwnerReports(false);
                    void loadConversations(false);
                }

                if (
                    reportId &&
                    ownerReportIds.has(reportId) &&
                    (eventType === 'new_sighting' || eventType === 'status_change')
                ) {
                    void loadOwnerReports(false);
                }

                if (reportId && chatContext?.reportId === reportId && (eventType === 'report_updated' || eventType === 'status_change')) {
                    const nextStatus =
                        typeof (payload.data as { status?: unknown } | undefined)?.status === 'string'
                            ? (payload.data as { status: string }).status
                            : typeof (payload.data as { newStatus?: unknown } | undefined)?.newStatus === 'string'
                                ? (payload.data as { newStatus: string }).newStatus
                                : typeof (payload as { newStatus?: unknown }).newStatus === 'string'
                                    ? (payload as { newStatus: string }).newStatus
                                    : '';

                    if (nextStatus) {
                        setChatContext((current) =>
                            current && current.reportId === reportId
                                ? { ...current, reportStatusLabel: getDisplayStatus(nextStatus as LostReport['status']) }
                                : current,
                        );
                    }
                }
            } catch {
                // Ignore malformed websocket events.
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'unsubscribe', channel: 'reports' }));

                for (const reportId of ownerReportIds) {
                    socket.send(JSON.stringify({ type: 'unsubscribe', reportId }));
                }
            }

            socket.close();
        };
    }, [chatContext?.reportId, myReports, session?.token]);

    const handleOwnerActionConfirm = async () => {
        if (!pendingOwnerAction) {
            return;
        }

        setIsSubmittingOwnerAction(true);
        setReportsError('');

        try {
            if (pendingOwnerAction.type === 'delete') {
                await deleteReport(pendingOwnerAction.report.id);
            } else {
                await updateReportStatus(pendingOwnerAction.report.id, 'found');
            }

            setPendingOwnerAction(null);
            await refreshOwnerReports();
        } catch (error) {
            setReportsError(formatApiError(error));
        } finally {
            setIsSubmittingOwnerAction(false);
        }
    };

    const getDisplayStatus = (status: LostReport['status']) => {
        if (status === 'possibly_found') {
            return 'Possibly Found';
        }
        if (status === 'found') {
            return 'Found';
        }
        if (status === 'archived') {
            return 'Archived';
        }

        return 'Lost';
    };

    const getStatusClassName = (status: LostReport['status']) => {
        if (status === 'possibly_found') {
            return 'bg-green-50 text-green-700';
        }
        if (status === 'found') {
            return 'bg-blue-50 text-blue-700';
        }
        if (status === 'archived') {
            return 'bg-gray-100 text-gray-700';
        }

        return 'bg-red-50 text-red-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="pt-16">
            <div className="max-w-[1200px] mx-auto px-8 py-12">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>
            
            {saveMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {saveMessage}
                </div>
            )}
            
            <div className={isStandaloneTab ? '' : 'flex gap-8'}>
                {!isStandaloneTab ? (
                    <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm p-2">
                        <button
                        onClick={() => changeTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            activeTab === 'profile'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                        </button>

                        <button
                        onClick={() => changeTab('password')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            activeTab === 'password'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        <Lock className="w-5 h-5" />
                        <span className="font-medium">Password</span>
                        </button>

                        <button
                        onClick={() => changeTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            activeTab === 'notifications'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        <Bell className="w-5 h-5" />
                        <span className="font-medium">Notifications</span>
                        </button>
                        
                        <button
                        onClick={() => changeTab('account')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            activeTab === 'account'
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        >
                        <Trash2 className="w-5 h-5" />
                        <span className="font-medium">Account</span>
                        </button>
                    </div>
                    </div>
                ) : null}
                
                <div className={isStandaloneTab ? '' : 'flex-1'}>
                <div className={`bg-white rounded-lg shadow-sm p-8 ${isStandaloneTab ? 'mx-auto max-w-[1200px]' : ''}`}>
                    
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                        
                        <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            </div>
                            
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                            </label>
                            <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                            </label>
                            <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                            Used for SMS notifications about potential matches
                            </p>
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handleProfileSave}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Save className="w-4 h-4" />
                            Save Changes
                            </button>
                        </div>
                        </div>
                    </div>
                    )}

                    {activeTab === 'reports' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Reports</h2>
                        <p className="text-gray-600 mb-6">Review found-item submissions for your reports and manage their final status.</p>

                        {reportsError ? (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {reportsError}
                            </div>
                        ) : null}

                        {isLoadingReports ? (
                            <p className="text-sm text-gray-500">Loading your reports...</p>
                        ) : null}

                        {!isLoadingReports && !myReports.length ? (
                            <p className="text-sm text-gray-500">You have not created any lost-item reports yet.</p>
                        ) : null}

                        {!isLoadingReports && myReports.length ? (
                            <div className="space-y-6">
                                {myReports.map((report) => {
                                    const sightings = reportSightings[report.id] ?? [];

                                    return (
                                        <div key={report.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">{report.itemName}</h3>
                                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(report.status)}`}>
                                                            {getDisplayStatus(report.status)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{report.description}</p>
                                                    <p className="text-sm text-gray-500">{report.lostLocationText || 'Location unavailable'}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {report.status !== 'found' && report.status !== 'archived' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPendingOwnerAction({ type: 'mark_found', report })}
                                                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Mark Found
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingOwnerAction({ type: 'delete', report })}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-5 border-t border-gray-200 pt-5">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-gray-900">Found Item Reports</h4>
                                                    <span className="text-xs text-gray-500">{sightings.length} submission{sightings.length === 1 ? '' : 's'}</span>
                                                </div>

                                                {sightings.length ? (
                                                    <div className="space-y-3">
                                                        {sightings.map((sighting) => (
                                                            <div key={sighting.id} className="rounded-lg border border-gray-200 bg-white p-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{sighting.finder?.displayName || 'Finder'}</p>
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
                                                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                                                        >
                                                                            <MessageSquare className="h-4 w-4" />
                                                                            Message Finder
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                                <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{sighting.note || 'No details provided.'}</p>
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
                                                    <p className="text-sm text-gray-500">No one has submitted a found-item report for this item yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                    )}

                    {activeTab === 'messages' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Messages</h2>
                        <p className="text-gray-600 mb-6">Open a conversation to see live updates for that report.</p>

                        {isLoadingConversations ? (
                            <p className="text-sm text-gray-500">Loading conversations...</p>
                        ) : null}

                        {!isLoadingConversations && !conversations.length ? (
                            <p className="text-sm text-gray-500">No conversations yet. Start one from a report or found-item submission.</p>
                        ) : null}

                        {!isLoadingConversations && conversations.length ? (
                            <div className="space-y-3">
                                {conversations.map((conversation) => (
                                    <button
                                        key={`${conversation.reportId}-${conversation.participant?.id ?? 'unknown'}`}
                                        type="button"
                                        onClick={() =>
                                            openChat({
                                                reportId: conversation.reportId,
                                                reportItemName: conversation.reportItemName,
                                                reportStatusLabel: conversation.reportStatus ? getDisplayStatus(conversation.reportStatus) : undefined,
                                                participant: conversation.participant,
                                            })
                                        }
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition-colors hover:bg-gray-100"
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
                                                    {conversation.participant ? `Participant: ${conversation.participant.displayName}` : 'Participant unavailable'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {conversation.lastMessage?.messageText || 'No messages yet.'}
                                                </p>
                                            </div>
                                            <div className="text-right text-xs text-gray-500">
                                                <p>{conversation.lastMessage ? formatDateTime(conversation.lastMessage.createdAt) : 'No timestamp'}</p>
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
                    )}
                     
                    {/* Password Tab */}
                    {activeTab === 'password' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>
                        
                        <div className="space-y-6 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                            </label>
                            <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                            </label>
                            <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                            </label>
                            <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handlePasswordChange}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Lock className="w-4 h-4" />
                            Update Password
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                        
                        <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                            <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailMatches}
                                onChange={(e) => setNotifications({ ...notifications, emailMatches: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Potential Matches</div>
                                <div className="text-sm text-gray-600">Get notified when a found item matches your lost item report</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailMessages}
                                onChange={(e) => setNotifications({ ...notifications, emailMessages: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Messages</div>
                                <div className="text-sm text-gray-600">Receive email when someone sends you a message</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailUpdates}
                                onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Product Updates</div>
                                <div className="text-sm text-gray-600">Occasional emails about new features and improvements</div>
                                </div>
                            </label>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
                            <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.smsMatches}
                                onChange={(e) => setNotifications({ ...notifications, smsMatches: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Potential Matches</div>
                                <div className="text-sm text-gray-600">Get instant SMS alerts for potential matches</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.smsMessages}
                                onChange={(e) => setNotifications({ ...notifications, smsMessages: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Messages</div>
                                <div className="text-sm text-gray-600">Receive SMS when someone sends you a message</div>
                                </div>
                            </label>
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handleNotificationsSave}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Save className="w-4 h-4" />
                            Save Preferences
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Account Tab */}
                    {activeTab === 'account' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Management</h2>
                        
                        <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
                            <p className="text-gray-600 mb-4">
                            Once you delete your account, there is no going back. All your lost item reports 
                            and messages will be permanently deleted.
                            </p>
                            <button className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                            </button>
                        </div>
                        
                        <div className="pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Account created:</span> January 15, 2026</p>
                            <p><span className="font-medium">Last login:</span> March 5, 2026</p>
                            <p><span className="font-medium">Active reports:</span> 2 lost items, 0 found items</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    )}
                    
                </div>
                </div>
            </div>
            </div>
        </div>
        <StatusConfirmationModal
            isOpen={pendingOwnerAction !== null}
            title={pendingOwnerAction?.type === 'delete' ? 'Delete Report' : 'Mark Item as Found'}
            message={
                pendingOwnerAction?.type === 'delete'
                    ? 'Delete this report permanently? This will also remove its found-item submissions.'
                    : 'Mark this report as found? Finders will still only be able to submit sightings to other active reports.'
            }
            confirmLabel={pendingOwnerAction?.type === 'delete' ? 'Delete Report' : 'Mark Found'}
            confirmButtonClassName={
                pendingOwnerAction?.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
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

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown time';
    }

    return date.toLocaleString();
}
