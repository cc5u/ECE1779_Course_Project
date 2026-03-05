import { useState } from 'react';
import { MapPin, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SightingCard } from '../components/SightingCard';
import { ChatMessage } from '../components/ChatMessage';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { UploadFoundItemModal } from '../components/UploadFoundItemModal';
import { StatusConfirmationModal } from '../components/StatusConfirmationModal';

export default function ReportDetail() {
  const [message, setMessage] = useState('');
  const [isOwner, setIsOwner] = useState(false); // Toggle for demo purposes
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [status, setStatus] = useState('Lost');
  const [sightingsList, setSightingsList] = useState([
    {
      uploaderName: 'John Smith',
      uploaderAvatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwcm9maWxlJTIwYXZhdGFyfGVufDF8fHx8MTc3MjM0OTYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      imageUrl: 'https://images.unsplash.com/photo-1546019739-f442c5e4696d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxsZXQlMjBvbiUyMGJlbmNofGVufDF8fHx8MTc3MjM5MzQwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      note: 'I think I saw this wallet on a bench near the ticket counter. It was there around 3:00 PM.',
      timestamp: '1 hour ago',
    },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { message: 'Hi, I think I found your wallet!', timestamp: '2:15 PM', isSender: false },
    { message: 'Really? That\'s great! Where did you find it?', timestamp: '2:16 PM', isSender: true },
    { message: 'Near the main entrance, on a bench. Can you describe what\'s inside?', timestamp: '2:17 PM', isSender: false },
  ]);

  // Mock data
  const report = {
    title: 'Black Leather Wallet',
    lostDate: 'Feb 28, 2026 at 2:30 PM',
    location: 'Union Station, Toronto',
    owner: 'Anonymous',
    mainImage: 'https://images.unsplash.com/photo-1703355685552-885762b8c9b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjB3YWxsZXR8ZW58MXx8fHwxNzcyMzkyODk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    description: 'Black leather wallet with multiple card slots. Contains driver\'s license, credit cards, and some cash. Lost near the main entrance of Union Station. The wallet has a small scratch on the back and a brown stitching detail.',
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSender: true,
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessage('');
    }
  };

  const handleUploadSighting = (imageUrl: string, note: string) => {
    const newSighting = {
      uploaderName: 'You',
      uploaderAvatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBwcm9maWxlJTIwYXZhdGFyfGVufDF8fHx8MTc3MjM0OTYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      imageUrl: imageUrl,
      note: note || 'Found this item',
      timestamp: 'Just now',
    };
    setSightingsList([...sightingsList, newSighting]);
  };

  const handleMarkAsFound = () => {
    setStatus('Found');
  };

  const handleScrollToChat = () => {
    const messagesSection = document.getElementById('messages-section');
    messagesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lost':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Possibly Found':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Found':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-[1440px] mx-auto flex h-[calc(100vh-4rem)]">
          {/* Left Section: Map - 60% width */}
          <div className="relative w-[60%] bg-white border-r border-gray-200">
            {/* Lost Location Overlay */}
            <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
              <p className="text-sm font-medium text-gray-700">Lost Location</p>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-6 right-6 z-10 bg-white rounded-lg shadow-md overflow-hidden">
              <button className="p-3 hover:bg-gray-50 transition-colors border-b border-gray-200">
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-3 hover:bg-gray-50 transition-colors">
                <ZoomOut className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Map Placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="detail-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#detail-grid)" />
                </svg>
              </div>

              {/* Pin with Radius */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                {/* Radius Circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-full bg-blue-500/10" />
                {/* Pin Marker */}
                <MapPin className="w-10 h-10 text-red-500 fill-red-500 relative z-10" />
              </div>
            </div>
          </div>

          {/* Right Section: Detail Panel - 40% width */}
          <div className="w-[40%] bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Item Summary */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-2xl font-semibold text-gray-900 flex-1">
                    {report.title}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">Lost:</span> {report.lostDate}</p>
                  <p><span className="font-medium text-gray-900">Location:</span> {report.location}</p>
                  <p><span className="font-medium text-gray-900">Owner:</span> {report.owner}</p>
                </div>
                
                {/* Demo Toggle */}
                <button
                  onClick={() => setIsOwner(!isOwner)}
                  className="mt-3 text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                >
                  Demo: {isOwner ? 'Switch to Viewer' : 'Switch to Owner'}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Image Section */}
              <div>
                <ImageWithFallback
                  src={report.mainImage}
                  alt={report.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {/* Thumbnail placeholders */}
                <div className="flex gap-2 mt-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-blue-500">
                    <ImageWithFallback
                      src={report.mainImage}
                      alt="Thumbnail 1"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                  <div className="w-16 h-16 bg-gray-100 rounded-lg"></div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{report.description}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Possible Sightings */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Possible Sightings</h2>
                <div className="space-y-3">
                  {sightingsList.map((sighting, index) => (
                    <SightingCard
                      key={index}
                      uploaderName={sighting.uploaderName}
                      uploaderAvatar={sighting.uploaderAvatar}
                      imageUrl={sighting.imageUrl}
                      note={sighting.note}
                      timestamp={sighting.timestamp}
                    />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isOwner ? (
                  <>
                    <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      I Found This Item
                    </button>
                    <button 
                      onClick={handleScrollToChat}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Send Message
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsStatusModalOpen(true)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      Mark as Found
                    </button>
                    <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                      Edit Report
                    </button>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Messages */}
              <div id="messages-section">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
                
                {/* Chat Container */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto border border-gray-200">
                  {chatMessages.map((msg, index) => (
                    <ChatMessage
                      key={index}
                      message={msg.message}
                      timestamp={msg.timestamp}
                      isSender={msg.isSender}
                    />
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <UploadFoundItemModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUploadSighting}
      />
      
      <StatusConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleMarkAsFound}
      />
    </div>
  );
}