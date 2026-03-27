import { useEffect, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
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

export function Home() {
    const [lostReports, setLostReports] = useState<LostReport[]>([]);
    const [mapPins, setMapPins] = useState<MapReport[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
    const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
    const [isSubmittingFoundReport, setIsSubmittingFoundReport] = useState(false);
    const [foundReportError, setFoundReportError] = useState('');

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

    useEffect(() => {
        if (!mapContainerRef.current) return;

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
            const firstLabelLayer = layers?.find((l) => l.type === 'symbol')?.id;

            map.addLayer({
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
            }, firstLabelLayer);
        });

        mapRef.current = map;
        return () => map.remove();
    }, []);
    useEffect(() => {
        if (!mapRef.current || mapPins.length === 0) return;

        const currentMarkers: maplibregl.Marker[] = [];

        mapPins.forEach((pin) => {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '18px';
            el.style.height = '18px';
            el.style.borderRadius = '50%';
            el.style.background = pin.status === 'possibly_found' ? '#22c55e' : '#ef4444';
            el.style.border = '3px solid white';
            el.style.cursor = 'pointer';

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([pin.longitude, pin.latitude])
                .setPopup(
                    new maplibregl.Popup({ offset: 25 }).setHTML(`
                        <div class="p-2">
                            <p class="font-bold">${pin.itemName}</p>
                            <button id="btn-${pin.id}" class="mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Report Found</button>
                        </div>
                    `)
                )
                .addTo(mapRef.current!);
            
            marker.getPopup().on('open', () => {
                document.getElementById(`btn-${pin.id}`)?.addEventListener('click', () => {
                    const report = lostReports.find(r => r.id === pin.id);
                    if (report) openFoundModal(report);
                });
            });

            currentMarkers.push(marker);
        });

        return () => currentMarkers.forEach(m => m.remove());
    }, [mapPins, lostReports]);

    const openFoundModal = (report: LostReport) => {
        setSelectedReport(report);
        setIsFoundModalOpen(true);
    };

    const closeFoundModal = () => {
        if (!isSubmittingFoundReport) {
            setIsFoundModalOpen(false);
            setSelectedReport(null);
        }
    };

    const handleFoundSubmit = async (data: FoundItemSubmission) => {
        if (!selectedReport) return;
        setIsSubmittingFoundReport(true);
        try {
            const note = `Found at: ${data.address}\nDescription: ${data.description}`;
            const sighting = await createSighting(selectedReport.id, { note });
            await uploadSightingImages(sighting.id, data.files);
            await refreshHomeData();
            closeFoundModal();
        } catch (error) {
            setFoundReportError(formatApiError(error));
        } finally {
            setIsSubmittingFoundReport(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16">
                <div className="max-w-[1440px] mx-auto flex h-[calc(100vh-4rem)]">
                    <div className="relative w-[70%] bg-white border-r border-gray-200">
                        
                        <div ref={mapContainerRef} className="h-full w-full relative z-0" />
                        
                        <Link to="/report" className="absolute bottom-8 right-8 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all">
                            <Plus className="w-6 h-6" />
                        </Link>
                    </div>

                    <div className="w-[30%] bg-white overflow-y-auto p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Lost Reports</h2>
                        {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}
                        {isLoading ? <p>Loading...</p> : (
                            <div className="space-y-4">
                                {lostReports.map((report) => (
                                    <ReportCard
                                        key={report.id}
                                        itemName={report.itemName}
                                        location={report.lostLocationText || 'Location unavailable'}
                                        time={formatRelativeTime(report.createdAt)}
                                        status={report.status === 'possibly_found' ? 'Possibly Found' : 'Lost'}
                                        imageUrl={report.images?.[0]?.publicUrl || ''}
                                        onClick={() => openFoundModal(report)}
                                    />
                                ))}
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
