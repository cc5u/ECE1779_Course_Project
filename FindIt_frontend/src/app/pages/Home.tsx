import { useEffect, useState } from 'react';
import { DivIcon } from 'leaflet';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Navbar } from '../components/Navbar';
import { ReportCard } from '../components/ReportCard';
import { UploadFoundItemModal, type FoundItemSubmission } from '../components/UploadFoundItemModal';
import {
    createSighting,
    formatApiError,
    getMapReports,
    getReports,
    uploadSightingImage,
    type LostReport,
    type MapReport,
} from '../lib/api';

export function Home() {
    const [lostReports, setLostReports] = useState<LostReport[]>([]);
    const [mapPins, setMapPins] = useState<MapReport[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
    const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
    const [isSubmittingFoundReport, setIsSubmittingFoundReport] = useState(false);
    const [foundReportError, setFoundReportError] = useState('');

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
                const [{ reports }, mapReports] = await Promise.all([
                    getReports(),
                    getMapReports(),
                ]);

                setLostReports(reports);
                setMapPins(mapReports);
            } catch (error) {
                setErrorMessage(formatApiError(error));
            } finally {
                setIsLoading(false);
            }
    }

    const openFoundModal = (report: LostReport) => {
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

    const handleFoundSubmit = async ({ address, description, file }: FoundItemSubmission) => {
        if (!selectedReport) {
            return;
        }

        setIsSubmittingFoundReport(true);
        setFoundReportError('');

        try {
            const note = [`Found at: ${address}`, `Description: ${description}`].join('\n');
            const sighting = await createSighting(selectedReport.id, { note });
            await uploadSightingImage(sighting.id, file);
            await refreshHomeData();
            closeFoundModal();
        } catch (error) {
            setFoundReportError(formatApiError(error));
        } finally {
            setIsSubmittingFoundReport(false);
        }
    };

    const createMarkerIcon = (color: string) =>
        new DivIcon({
            className: 'custom-map-pin',
            html: `
                <div style="position: relative; width: 20px; height: 20px;">
                    <span style="position: absolute; inset: -10px; border-radius: 9999px; background: ${color}; opacity: 0.2;"></span>
                    <span style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; border: 3px solid white; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);"></span>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10],
        });

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="pt-16">
            <div className="max-w-[1440px] mx-auto flex h-[calc(100vh-4rem)]">
            {/* Map Area - 70% width */}
            <div className="relative w-[70%] bg-white border-r border-gray-200">
                {/* Hero Message Overlay */}
                <div className="absolute top-8 left-8 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg max-w-md">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Help people find their lost belongings
                </h1>
                <p className="text-gray-600">
                    Report lost items or help others by marking found items.
                </p>
                </div>

                <div className="w-full h-full relative">
                <MapContainer
                    center={[43.6532, -79.3832]}
                    zoom={13}
                    scrollWheelZoom
                    className="h-full w-full z-0"
                >
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapPins.map((pin) => (
                    <Marker
                        key={pin.id}
                        position={[pin.latitude, pin.longitude]}
                        icon={createMarkerIcon(pin.status === 'possibly_found' ? '#22c55e' : '#ef4444')}
                    >
                        <Popup>
                            <div className="space-y-1">
                                <p className="font-medium text-gray-900">{pin.itemName}</p>
                                <p className="text-sm text-gray-600">{pin.lostLocationText || 'Location unavailable'}</p>
                                <p className="text-xs text-gray-500">Reported by {pin.owner.displayName}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const matchingReport = lostReports.find((report) => report.id === pin.id);
                                        if (matchingReport) {
                                            openFoundModal(matchingReport);
                                        }
                                    }}
                                    className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    Report Found
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                    ))}
                </MapContainer>
                </div>

                {/* Floating Action Button */}
                <Link 
                to="/report"
                className="absolute bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all w-16 h-16 flex items-center justify-center group"
                >
                <Plus className="w-6 h-6" />
                <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Report
                </span>
                </Link>
            </div>

            {/* Right Sidebar - 30% width */}
            <div className="w-[30%] bg-white overflow-y-auto">
                <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Recent Lost Reports
                </h2>

                {errorMessage ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <p className="text-sm text-gray-500">Loading reports...</p>
                ) : null}

                {!isLoading && !errorMessage ? (
                    <div className="space-y-4">
                        {lostReports.length ? (
                            lostReports.map((report) => (
                                <div key={report.id}>
                                    <ReportCard
                                        itemName={report.itemName}
                                        location={report.lostLocationText || 'Location unavailable'}
                                        time={formatRelativeTime(report.createdAt)}
                                        status={report.status === 'possibly_found' ? 'Possibly Found' : 'Lost'}
                                        imageUrl={report.images?.[0]?.publicUrl || ''}
                                        onClick={() => openFoundModal(report)}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No reports found yet.</p>
                        )}
                    </div>
                ) : null}
                </div>
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
