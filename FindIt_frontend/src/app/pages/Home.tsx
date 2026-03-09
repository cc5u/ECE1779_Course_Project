import { Plus } from 'lucide-react';
import { Link } from 'react-router';
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
        { id: 1, x: '25%', y: '30%', color: 'bg-red-500' },
        { id: 2, x: '50%', y: '60%', color: 'bg-green-500' },
        { id: 3, x: '75%', y: '20%', color: 'bg-blue-500' },
    ]; // This will eventually be fetched from the backend

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

                {/* Map Placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {/* Grid pattern to simulate map */}
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Map Label */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg pointer-events-none">
                    Map View
                </div>

                {/* Map Pins */}
                {mapPins.map((pin) => (
                    <div
                    key={pin.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pin.x, top: pin.y }}
                    >
                    <div className={`w-6 h-6 ${pin.color} rounded-full shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform`}>
                        <div className={`w-12 h-12 ${pin.color} opacity-20 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping`}></div>
                    </div>
                    </div>
                ))}
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