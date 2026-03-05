import { useState } from 'react';
import { Link } from 'react-router';
import { Upload, MapPin } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export default function ReportLostItem() {
  const [radius, setRadius] = useState(200);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pinPosition, setPinPosition] = useState({ x: '50%', y: '50%' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPinPosition({ x: `${x}%`, y: `${y}%` });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-[800px] mx-auto px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8">
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Report a Lost Item
              </h1>
              <p className="text-gray-600">
                Provide details about your lost item so others can help you find it.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6">
              {/* Item Name */}
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-900 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="itemName"
                  placeholder="e.g., Black leather wallet"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Provide additional details such as brand, color, or identifying features"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Lost Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lostDate" className="block text-sm font-medium text-gray-900 mb-2">
                    Lost Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="lostDate"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lostTime" className="block text-sm font-medium text-gray-900 mb-2">
                    Lost Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="lostTime"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Search Location */}
              <div>
                <label htmlFor="searchLocation" className="block text-sm font-medium text-gray-900 mb-2">
                  Search Location
                </label>
                <input
                  type="text"
                  id="searchLocation"
                  placeholder="Enter address or place"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Lost Location Map */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Lost Location <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Click on the map to mark where the item was lost
                </p>
                <div 
                  className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg relative cursor-crosshair border-2 border-gray-300 overflow-hidden"
                  onClick={handleMapClick}
                >
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#map-grid)" />
                    </svg>
                  </div>

                  {/* Map Label */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
                    Interactive Map
                  </div>

                  {/* Pin Marker */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: pinPosition.x, top: pinPosition.y }}
                  >
                    {/* Radius Circle */}
                    <div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-blue-500 rounded-full bg-blue-500/10"
                      style={{ 
                        width: `${radius / 2}px`, 
                        height: `${radius / 2}px`,
                      }}
                    />
                    {/* Pin Icon on top of circle */}
                    <MapPin className="w-8 h-8 text-red-500 fill-red-500 relative z-10" />
                  </div>
                </div>
              </div>

              {/* Approximate Area Radius */}
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-900 mb-2">
                  Search Radius: <span className="text-blue-600 font-semibold">{radius} meters</span>
                </label>
                <input
                  type="range"
                  id="radius"
                  min="50"
                  max="1000"
                  step="50"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50m</span>
                  <span>1000m</span>
                </div>
              </div>

              {/* Upload Image */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Upload Image (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-gray-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-gray-600">Upload a photo of the item</p>
                        <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Link
                  to="/"
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}