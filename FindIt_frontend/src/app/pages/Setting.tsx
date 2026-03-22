import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { User, Lock, Bell, Trash2, Save } from 'lucide-react';
import { getProfile } from '../lib/api';
import { getStoredSession } from '../lib/auth';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'account'>('profile');
    
    // Profile state
    const [profile, setProfile] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
    });
    
    // Password state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    
    // Notifications state
    const [notifications, setNotifications] = useState({
        emailMatches: true,
        emailMessages: true,
        emailUpdates: false,
        smsMatches: true,
        smsMessages: false,
    });
    
    const [saveMessage, setSaveMessage] = useState('');
    const session = getStoredSession();

    useEffect(() => {
        async function loadProfile() {
            if (!session?.token) {
                return;
            }

            try {
                const user = await getProfile();
                const nameParts = user.displayName.split(' ');
                setProfile((current) => ({
                    ...current,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' '),
                    email: user.uoftEmail,
                }));
            } catch {
                // Keep the existing placeholder state if the profile request fails.
            }
        }

        void loadProfile();
    }, [session?.token]);

    const handleProfileSave = () => {
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handlePasswordChange = () => {
        if (passwords.new !== passwords.confirm) {
        setSaveMessage('New passwords do not match!');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
        }
        setSaveMessage('Password changed successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleNotificationsSave = () => {
        setSaveMessage('Notification preferences saved!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="pt-16">
            <div className="max-w-[1200px] mx-auto px-8 py-12">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>
            
            {saveMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {saveMessage}
                </div>
            )}
            
            <div className="flex gap-8">
                {/* Sidebar Navigation */}
                <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm p-2">
                    <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'profile'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                    </button>
                    
                    <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'password'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Password</span>
                    </button>
                    
                    <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'notifications'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    >
                    <Bell className="w-5 h-5" />
                    <span className="font-medium">Notifications</span>
                    </button>
                    
                    <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === 'account'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Account</span>
                    </button>
                </div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                        
                        <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            </div>
                            
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                            </label>
                            <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                            </label>
                            <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                            Used for SMS notifications about potential matches
                            </p>
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handleProfileSave}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Save className="w-4 h-4" />
                            Save Changes
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Password Tab */}
                    {activeTab === 'password' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>
                        
                        <div className="space-y-6 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                            </label>
                            <input
                            type="password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                            </label>
                            <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                            </label>
                            <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handlePasswordChange}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Lock className="w-4 h-4" />
                            Update Password
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                        
                        <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                            <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailMatches}
                                onChange={(e) => setNotifications({ ...notifications, emailMatches: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Potential Matches</div>
                                <div className="text-sm text-gray-600">Get notified when a found item matches your lost item report</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailMessages}
                                onChange={(e) => setNotifications({ ...notifications, emailMessages: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Messages</div>
                                <div className="text-sm text-gray-600">Receive email when someone sends you a message</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.emailUpdates}
                                onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Product Updates</div>
                                <div className="text-sm text-gray-600">Occasional emails about new features and improvements</div>
                                </div>
                            </label>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
                            <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.smsMatches}
                                onChange={(e) => setNotifications({ ...notifications, smsMatches: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Potential Matches</div>
                                <div className="text-sm text-gray-600">Get instant SMS alerts for potential matches</div>
                                </div>
                            </label>
                            
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                type="checkbox"
                                checked={notifications.smsMessages}
                                onChange={(e) => setNotifications({ ...notifications, smsMessages: e.target.checked })}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                <div className="font-medium text-gray-900">Messages</div>
                                <div className="text-sm text-gray-600">Receive SMS when someone sends you a message</div>
                                </div>
                            </label>
                            </div>
                        </div>
                        
                        <div className="pt-4">
                            <button
                            onClick={handleNotificationsSave}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                            <Save className="w-4 h-4" />
                            Save Preferences
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Account Tab */}
                    {activeTab === 'account' && (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Management</h2>
                        
                        <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
                            <p className="text-gray-600 mb-4">
                            Once you delete your account, there is no going back. All your lost item reports 
                            and messages will be permanently deleted.
                            </p>
                            <button className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                            </button>
                        </div>
                        
                        <div className="pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Account created:</span> January 15, 2026</p>
                            <p><span className="font-medium">Last login:</span> March 5, 2026</p>
                            <p><span className="font-medium">Active reports:</span> 2 lost items, 0 found items</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    )}
                    
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}
