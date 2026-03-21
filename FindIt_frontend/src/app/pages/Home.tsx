import { DivIcon } from 'leaflet';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Navbar } from '../components/Navbar';
import { ReportCard } from '../components/ReportCard';

export function Home() {
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
            position: [43.6532, -79.3832] as [number, number],
            label: 'Union Station',
            color: '#ef4444',
        },
        {
            id: 2,
            position: [43.6465, -79.3892] as [number, number],
            label: 'CN Tower',
            color: '#22c55e',
        },
        {
            id: 3,
            position: [43.6677, -79.3948] as [number, number],
            label: 'Royal Ontario Museum',
            color: '#3b82f6',
        },
    ]; // This will eventually be fetched from the backend

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
                    <Marker key={pin.id} position={pin.position} icon={createMarkerIcon(pin.color)}>
                        <Popup>{pin.label}</Popup>
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
