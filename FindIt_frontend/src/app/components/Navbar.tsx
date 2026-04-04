import { ClipboardList, MapPin, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { ProfileDropdown } from "./ProfileDropdown";

export function Navbar() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const isHomePage = location.pathname === "/home";
    const isCreateReportPage = location.pathname === "/report";
    const isReportsPage = location.pathname === "/reports";
    const isMessagesPage = location.pathname === "/messages";

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold text-gray-900">FindIt</span>
            </Link>
        
            <div className="flex items-center gap-3">
            <Link to="/home" className={`px-4 py-2 font-medium transition-colors ${
                isHomePage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
                Home
            </Link>
            {isAuthenticated ? (
                <>
                    <Link
                        to="/reports"
                        className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            isReportsPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        My Reports
                    </Link>
                    <Link
                        to="/messages"
                        className={`inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            isMessagesPage ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                    </Link>
                </>
            ) : null}
            <Link 
                to="/report" 
                className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors ${
                isCreateReportPage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                Report Lost Item
            </Link>
            {isAuthenticated ? (
                <ProfileDropdown />
            ) : (
                <>
                    <Link
                        to="/login"
                        className="px-4 py-2 font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Create Account
                    </Link>
                </>
            )}
            </div>
        </div>
        </nav>
    );
}    
