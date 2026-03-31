import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ReportChatModal } from '../components/ReportChatModal';
import { ReportCard } from '../components/ReportCard';
import { UploadFoundItemModal, type FoundItemSubmission } from '../components/UploadFoundItemModal';
import {
    createSighting,
    formatApiError,
    getMapReports,
    getReports,
    uploadSightingImages,
    type LostReport,
    type MapReport,
} from '../lib/api';
import { getStoredSession } from '../lib/auth';

export function Home() {
    const session = getStoredSession();
    const currentUserId = session?.user.id ?? null;
    const [lostReports, setLostReports] = useState<LostReport[]>([]);
    const [mapPins, setMapPins] = useState<MapReport[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
    const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
    const [isSubmittingFoundReport, setIsSubmittingFoundReport] = useState(false);
    const [foundReportError, setFoundReportError] = useState('');
    const [chatReport, setChatReport] = useState<LostReport | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        async function loadHomeData() {
            await refreshHomeData();
        }

        void loadHomeData();
    }, []);

    async function refreshHomeData() {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [{ reports }, nextMapReports] = await Promise.all([
                getReports(),
                getMapReports(),
            ]);

            setLostReports(reports);
            setMapPins(nextMapReports);
        } catch (error) {
            setErrorMessage(formatApiError(error));
        } finally {
            setIsLoading(false);
        }
    }

    const openFoundModal = (report: LostReport) => {
        if (report.owner?.id === currentUserId || report.status === 'found' || report.status === 'archived') {
            return;
        }

        setSelectedReport(report);
        setFoundReportError('');
        setIsFoundModalOpen(true);
    };

    const closeFoundModal = () => {
        if (isSubmittingFoundReport) {
            return;
        }

        setIsFoundModalOpen(false);
        setSelectedReport(null);
        setFoundReportError('');
    };

    const openChatModal = (report: LostReport) => {
        if (!session?.token || !report.owner || report.owner.id === currentUserId) {
            return;
        }

        setChatReport(report);
    };

    const closeChatModal = () => {
        setChatReport(null);
    };

    const handleFoundSubmit = async ({ address, description, files }: FoundItemSubmission) => {
        if (!selectedReport) {
            return;
        }

        setIsSubmittingFoundReport(true);
        setFoundReportError('');

        try {
            const note = [`Found at: ${address}`, `Description: ${description}`].join('\n');
            const sighting = await createSighting(selectedReport.id, { note });
            await uploadSightingImages(sighting.id, files);
            await refreshHomeData();
            closeFoundModal();
        } catch (error) {
            setFoundReportError(formatApiError(error));
        } finally {
            setIsSubmittingFoundReport(false);
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

    useEffect(() => {
        if (!mapContainerRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [-79.3987, 43.6629],
            zoom: 15.8,
            pitch: 55,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            const layers = map.getStyle().layers;
            const firstLabelLayer = layers?.find((layer) => layer.type === 'symbol')?.id;

            map.addLayer(
                {
                    id: '3d-buildings',
                    type: 'fill-extrusion',
                    source: 'openmaptiles',
                    'source-layer': 'building',
                    paint: {
                        'fill-extrusion-color': '#d9d2c3',
                        'fill-extrusion-height': ['get', 'render_height'],
                        'fill-extrusion-base': ['get', 'render_min_height'],
                        'fill-extrusion-opacity': 0.68,
                    },
                },
                firstLabelLayer,
            );
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const currentMarkers: maplibregl.Marker[] = [];

        mapPins.forEach((pin) => {
            const matchingReport = lostReports.find((report) => report.id === pin.id);
            const canReportFound =
                Boolean(matchingReport) &&
                matchingReport?.owner?.id !== currentUserId &&
                matchingReport?.status !== 'found' &&
                matchingReport?.status !== 'archived';
            const canMessageOwner = Boolean(
                matchingReport &&
                    session?.token &&
                    matchingReport.owner &&
                    matchingReport.owner.id !== currentUserId,
            );

            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.style.width = '18px';
            markerElement.style.height = '18px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.background = pin.status === 'possibly_found' ? '#22c55e' : '#ef4444';
            markerElement.style.border = '3px solid white';
            markerElement.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.18)';
            markerElement.style.cursor = 'pointer';

            const popupContent = document.createElement('div');
            popupContent.className = 'p-2 space-y-1';

            const title = document.createElement('p');
            title.className = 'font-bold';
            title.textContent = pin.itemName;
            popupContent.appendChild(title);

            const location = document.createElement('p');
            location.className = 'text-sm text-gray-600';
            location.textContent = pin.lostLocationText || 'Location unavailable';
            popupContent.appendChild(location);

            const owner = document.createElement('p');
            owner.className = 'text-xs text-gray-500';
            owner.textContent = `Reported by ${pin.owner.displayName}`;
            popupContent.appendChild(owner);

            if (canReportFound || canMessageOwner) {
                const actions = document.createElement('div');
                actions.className = 'mt-2 flex flex-wrap gap-2';

                if (canReportFound && matchingReport) {
                    const reportFoundButton = document.createElement('button');
                    reportFoundButton.type = 'button';
                    reportFoundButton.className = 'rounded bg-blue-600 px-2 py-1 text-xs text-white';
                    reportFoundButton.textContent = 'Report Found';
                    reportFoundButton.addEventListener('click', () => {
                        openFoundModal(matchingReport);
                    });
                    actions.appendChild(reportFoundButton);
                }

                if (canMessageOwner && matchingReport) {
                    const messageOwnerButton = document.createElement('button');
                    messageOwnerButton.type = 'button';
                    messageOwnerButton.className = 'rounded border border-gray-300 px-2 py-1 text-xs text-gray-700';
                    messageOwnerButton.textContent = 'Message Owner';
                    messageOwnerButton.addEventListener('click', () => {
                        openChatModal(matchingReport);
                    });
                    actions.appendChild(messageOwnerButton);
                }

                popupContent.appendChild(actions);
            }

            const marker = new maplibregl.Marker({ element: markerElement })
                .setLngLat([pin.longitude, pin.latitude])
                .setPopup(new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent))
                .addTo(map);

            currentMarkers.push(marker);
        });

        return () => {
            currentMarkers.forEach((marker) => marker.remove());
        };
    }, [currentUserId, lostReports, mapPins, session?.token]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16">
                <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1440px]">
                    <div className="relative w-[70%] border-r border-gray-200 bg-white">
                        <div ref={mapContainerRef} className="relative h-full w-full z-0" />

                        <Link
                            to="/report"
                            className="absolute bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700"
                        >
                            <Plus className="h-6 w-6" />
                        </Link>
                    </div>

                    <div className="w-[30%] overflow-y-auto bg-white p-6">
                        <h2 className="mb-6 text-xl font-semibold text-gray-900">Recent Lost Reports</h2>

                        {errorMessage ? (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}

                        {isLoading ? (
                            <p className="text-sm text-gray-500">Loading reports...</p>
                        ) : (
                            <div className="space-y-4">
                                {lostReports.length ? (
                                    lostReports.map((report) => (
                                        <ReportCard
                                            key={report.id}
                                            itemName={report.itemName}
                                            location={report.lostLocationText || 'Location unavailable'}
                                            time={formatRelativeTime(report.createdAt)}
                                            status={getDisplayStatus(report.status)}
                                            imageUrl={report.images?.[0]?.publicUrl || ''}
                                            onClick={report.owner?.id === currentUserId ? undefined : () => openFoundModal(report)}
                                            actions={
                                                session?.token &&
                                                report.owner?.id !== currentUserId &&
                                                report.status !== 'found' &&
                                                report.status !== 'archived' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openChatModal(report)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        Message Owner
                                                    </button>
                                                ) : null
                                            }
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No reports found yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <UploadFoundItemModal
                isOpen={isFoundModalOpen}
                itemName={selectedReport?.itemName || 'Lost item'}
                isSubmitting={isSubmittingFoundReport}
                errorMessage={foundReportError}
                onClose={closeFoundModal}
                onSubmit={handleFoundSubmit}
            />
            <ReportChatModal
                isOpen={chatReport !== null}
                reportId={chatReport?.id ?? null}
                reportItemName={chatReport?.itemName}
                reportStatusLabel={chatReport ? getDisplayStatus(chatReport.status) : undefined}
                participant={chatReport?.owner}
                currentUserId={currentUserId}
                authToken={session?.token ?? null}
                onClose={closeChatModal}
            />
        </div>
    );
}

function formatRelativeTime(timestamp: string) {
    const value = new Date(timestamp).getTime();
    const diffMs = Date.now() - value;

    if (Number.isNaN(value) || diffMs < 0) {
        return 'Just now';
    }

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
        return 'Just now';
    }
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
