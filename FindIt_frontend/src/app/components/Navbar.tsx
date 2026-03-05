import { MapPin, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { ProfileDropdown } from './ProfileDropdown';

export function Navbar() {
  const location = useLocation();
  const isReportPage = location.pathname === '/report';

  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">FindIt</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link to="/home" className={`px-4 py-2 font-medium transition-colors ${
            !isReportPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
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
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
}