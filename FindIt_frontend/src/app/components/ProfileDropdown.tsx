import {useState, useRef, useEffect} from 'react';
import {LogOut, Mail} from 'lucide-react';
import {useNavigate} from 'react-router';
import { getAuthenticatedWebSocketUrl, getProfile } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false); // State to track dropdown visibility
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown element
    const navigate = useNavigate(); // Hook for navigation
    const { session, clearSession } = useAuth();
    const [activeLostCount, setActiveLostCount] = useState(0);
    const [foundCount, setFoundCount] = useState(0);

    useEffect(() => {
      if (!session?.token) {
        setActiveLostCount(0);
        setFoundCount(0);
        return;
      }

      let cancelled = false;

      async function loadProfileSummary() {
        try {
          const profile = await getProfile();

          if (cancelled) {
            return;
          }

          setActiveLostCount(profile.reportStatusCounts?.activeLost ?? profile._count?.reports ?? 0);
          setFoundCount(profile.reportStatusCounts?.found ?? 0);
        } catch {
          if (!cancelled) {
            setActiveLostCount(0);
            setFoundCount(0);
          }
        }
      }

      void loadProfileSummary();

      const socket = new WebSocket(getAuthenticatedWebSocketUrl(session.token));

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'reports' }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string };

          if (
            payload.type === 'report_created' ||
            payload.type === 'report_updated' ||
            payload.type === 'report_deleted'
          ) {
            void loadProfileSummary();
          }
        } catch {
          // Ignore malformed websocket events.
        }
      };

      return () => {
        cancelled = true;

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'unsubscribe', channel: 'reports' }));
        }

        socket.close();
      };
    }, [session?.token]);

    const initials = session?.user.displayName
      ? session.user.displayName
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'GU';

    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent){
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false); // Close the dropdown if clicked outside
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside); // Add event listener when dropdown is open
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside); // Clean up event listener on unmount
        };
    }, [isOpen]); // Function to handle clicks outside the dropdown

    const handleLogout = () => {
        setIsOpen(false); 
        clearSession();
        navigate('/login', { replace: true });
    }; // Function to handle logout action

    return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center ml-2 hover:bg-gray-300 transition-colors"
        title="Profile"
      >
        <span className="text-gray-600 text-sm font-medium">{initials}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg font-semibold">{initials}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{session?.user.displayName || 'Guest User'}</div>
                <div className="text-sm text-gray-500">{session?.user.uoftEmail || 'Not signed in'}</div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{session?.user.uoftEmail || 'Not signed in'}</span>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{activeLostCount}</div>
                <div className="text-xs text-gray-500">Lost Items</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">{foundCount}</div>
                <div className="text-xs text-gray-500">Found Items</div>
              </div>
            </div>
          </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
      )}
    </div>
  );
}
