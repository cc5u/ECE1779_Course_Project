import { MapPin, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function Navbar() {
  const location = useLocation();
  const isReportPage = location.pathname === '/report';
  const isSettingsPage = location.pathname === '/settings';
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">FindIt</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link to="/home" className={`px-4 py-2 font-medium transition-colors ${
            !isReportPage && !isSettingsPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}>
            Home
          </Link>
          <Link 
            to="/report" 
            className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors ${
              isReportPage 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Report Lost Item
          </Link>
          <Link 
            to="/settings" 
            className={`p-2 rounded-lg transition-colors ${
              isSettingsPage 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <Link to="/" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Logout
          </Link>
          <Link 
            to="/settings"
            className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ml-2 hover:bg-gray-300 transition-colors"
            title="Profile Settings"
          >
            <span className="text-gray-600 text-sm font-medium">JD</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}