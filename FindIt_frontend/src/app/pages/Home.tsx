import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ReportCard } from '../components/ReportCard';

export function Home() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const lostReports =[
        {
        itemName: 'Lost Black Wallet',
        location: 'Downtown Toronto',
        time: '2 hours ago',
        status: 'Lost' as const,
        imageUrl: 'https://images.unsplash.com/photo-1703355685552-885762b8c9b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjB3YWxsZXR8ZW58MXx8fHwxNzcyMzkyODk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
    ]; // This will eventually be fetched from the backend

    const mapPins = [
        {
            id: 1,
            position: [-79.3992, 43.6645] as [number, number],
            label: 'Robarts Library',
            color: '#d97706',
        },
        {
            id: 2,
            position: [-79.3984, 43.6596] as [number, number],
            label: 'Bahen Centre',
            color: '#0f766e',
        },
        {
            id: 3,
            position: [-79.4014, 43.6629] as [number, number],
            label: 'Sidney Smith Hall',
            color: '#2563eb',
        },
        {
            id: 4,
            position: [-79.3948, 43.6677] as [number, number],
            label: 'Royal Ontario Museum',
            color: '#7c3aed',
        },
        {
            id: 5,
            position: [-79.3929, 43.6627] as [number, number],
            label: 'Union Station',
            color: '#dc2626',
        },
    ]; // This will eventually be fetched from the backend

    useEffect(() => {
        if (!mapContainerRef.current) {
            return undefined;
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
            const firstLabelLayer = map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id;

            map.addLayer(
                {
                    id: '3d-buildings',
                    type: 'fill-extrusion',
                    source: 'openmaptiles',
                    'source-layer': 'building',
                    minzoom: 13,
                    paint: {
                        'fill-extrusion-color': [
                            'interpolate',
                            ['linear'],
                            ['coalesce', ['get', 'render_height'], ['get', 'height'], 15],
                            0, '#d9d2c3',
                            20, '#c9bea8',
                            60, '#b39b7a',
                        ],
                        'fill-extrusion-height': [
                            'coalesce',
                            ['get', 'render_height'],
                            ['get', 'height'],
                            15,
                        ],
                        'fill-extrusion-base': [
                            'coalesce',
                            ['get', 'render_min_height'],
                            ['get', 'min_height'],
                            0,
                        ],
                        'fill-extrusion-opacity': 0.68,
                    },
                },
                firstLabelLayer,
            );

            const bounds = new maplibregl.LngLatBounds();
            mapPins.forEach((pin) => bounds.extend(pin.position));
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 80, maxZoom: 16.2, duration: 0 });
            }
        });

        const markers = mapPins.map((pin) => {
            const markerElement = document.createElement('button');
            markerElement.type = 'button';
            markerElement.setAttribute('aria-label', pin.label);
            markerElement.style.width = '18px';
            markerElement.style.height = '18px';
            markerElement.style.borderRadius = '9999px';
            markerElement.style.background = pin.color;
            markerElement.style.border = '3px solid white';
            markerElement.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.24)';
            markerElement.style.cursor = 'pointer';

            return new maplibregl.Marker({ element: markerElement, anchor: 'center' })
                .setLngLat(pin.position)
                .setPopup(
                    new maplibregl.Popup({ offset: 18 }).setHTML(
                        `<div style="font-weight:600;color:#111827;">${pin.label}</div>`,
                    ),
                )
                .addTo(map);
        });

        return () => {
            markers.forEach((marker) => marker.remove());
            map.remove();
        };
    }, []);

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

                <div ref={mapContainerRef} className="h-full w-full relative z-0" />

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
                
                <div className="space-y-4">
                    {lostReports.map((report, index) => (
                    <Link to={`/report/${index + 1}`} key={index}>
                        <ReportCard
                        itemName={report.itemName}
                        location={report.location}
                        time={report.time}
                        status={report.status}
                        imageUrl={report.imageUrl}
                        />
                    </Link>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </main>
        </div>
    );
    }   
