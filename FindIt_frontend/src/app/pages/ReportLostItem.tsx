import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Upload, MapPin } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { createReport, formatApiError, uploadReportImages } from '../lib/api';

type LocationSearchResult = {
    lat: string;
    lon: string;
    display_name: string;
};

function LocationPicker({
    onSelect,
}: {
    onSelect: (position: [number, number]) => void;
}) {
    useMapEvents({
        click(event) {
            onSelect([event.latlng.lat, event.latlng.lng]);
        },
    });

    return null;
}

function MapViewport({ center }: { center: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, map.getZoom(), {
            duration: 1,
        });
    }, [center, map]);

    return null;
}

export default function ReportLostItem() {
    const navigate = useNavigate();
    const [radius, setRadius] = useState(200);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [pinPosition, setPinPosition] = useState<[number, number]>([43.6532, -79.3832]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        lostDate: '',
        lostTime: '',
        searchLocation: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');
    const skipAddressLookupRef = useRef(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);

        if (previewUrls.length) {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        }

        if (files.length) {
            setSelectedFiles(files);
            setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
            return;
        }

        setSelectedFiles([]);
        setPreviewUrls([]);
    }; // This function handles the file input change event.
    //  It retrieves the selected files, updates the state, and generates preview URLs for displaying them.

    useEffect(() => {
        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.target.id === 'searchLocation') {
            skipAddressLookupRef.current = false;
            setLocationMessage('');
        }

        setFormData((current) => ({
            ...current,
            [e.target.id]: e.target.value,
        }));
    };

    useEffect(() => {
        const query = formData.searchLocation.trim();

        if (skipAddressLookupRef.current || query.length < 3) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setIsResolvingLocation(true);
            setLocationMessage('');

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Unable to find that address.');
                }

                const results = (await response.json()) as LocationSearchResult[];

                if (!results.length) {
                    setLocationMessage('No matching address found. Try a more specific search.');
                    return;
                }

                const [match] = results;
                setPinPosition([Number(match.lat), Number(match.lon)]);
                setLocationMessage(`Map updated to ${match.display_name}`);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setLocationMessage('Address lookup failed. You can still click the map to choose a location.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsResolvingLocation(false);
                }
            }
        }, 500);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [formData.searchLocation]);

    const handleMapSelection = async (position: [number, number]) => {
        setPinPosition(position);
        setLocationMessage('');
        setIsResolvingLocation(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position[0]}&lon=${position[1]}`,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Unable to resolve the selected point.');
            }

            const result = (await response.json()) as { display_name?: string };

            if (result.display_name) {
                skipAddressLookupRef.current = true;
                setFormData((current) => ({
                    ...current,
                    searchLocation: result.display_name ?? current.searchLocation,
                }));
                setLocationMessage(`Address updated from map selection.`);
            }
        } catch {
            setLocationMessage('Coordinates updated. Address could not be resolved automatically.');
        } finally {
            setIsResolvingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        if (!formData.lostDate || !formData.lostTime) {
            setErrorMessage('Lost date and time are required.');
            return;
        }

        setIsSubmitting(true);

        try {
            const report = await createReport({
                itemName: formData.itemName,
                description: formData.description,
                lostTime: new Date(`${formData.lostDate}T${formData.lostTime}`).toISOString(),
                lostLocationText: formData.searchLocation,
                latitude: pinPosition[0],
                longitude: pinPosition[1],
                radiusMeters: radius,
            });

            if (selectedFiles.length) {
                await uploadReportImages(report.id, selectedFiles);
            }

            navigate('/home');
        } catch (error) {
            setErrorMessage(formatApiError(error));
        } finally {
            setIsSubmitting(false);
        }
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
                <form className="space-y-6" onSubmit={handleSubmit}>
                {errorMessage ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                    </div>
                ) : null}
                {/* Item Name */}
                <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-900 mb-2">
                    Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="text"
                    id="itemName"
                    placeholder="e.g., Black leather wallet"
                    value={formData.itemName}
                    onChange={handleChange}
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
                    value={formData.description}
                    onChange={handleChange}
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
                        value={formData.lostDate}
                        onChange={handleChange}
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
                        value={formData.lostTime}
                        onChange={handleChange}
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
                    value={formData.searchLocation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                    {isResolvingLocation ? 'Updating map location...' : locationMessage || 'Type an address to move the map, or click the map to fill the address.'}
                    </p>
                </div>

                {/* Lost Location Map */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                    Lost Location <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                    Click on the map to mark where the item was lost
                    </p>
                    <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-300">
                    <MapContainer
                        center={pinPosition}
                        zoom={13}
                        scrollWheelZoom
                        className="h-full w-full cursor-crosshair"
                    >
                        <MapViewport center={pinPosition} />
                        <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationPicker onSelect={handleMapSelection} />
                        <Circle
                        center={pinPosition}
                        radius={radius}
                        pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15 }}
                        />
                        <Marker position={pinPosition}>
                        <Popup>
                            Lost item location
                            <br />
                            {pinPosition[0].toFixed(5)}, {pinPosition[1].toFixed(5)}
                        </Popup>
                        </Marker>
                    </MapContainer>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Selected coordinates: {pinPosition[0].toFixed(5)}, {pinPosition[1].toFixed(5)}
                    </p>
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
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer">
                        {previewUrls.length ? (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                {previewUrls.map((previewUrl, index) => (
                                    <img
                                        key={previewUrl}
                                        src={previewUrl}
                                        alt={`Preview ${index + 1}`}
                                        className="h-32 w-full rounded-lg object-cover"
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-gray-600">Click to change images</p>
                        </div>
                        ) : (
                        <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="text-gray-600">Upload photos of the item</p>
                            <p className="text-sm text-gray-500">Click to browse one or more images</p>
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
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
                </form>
            </div>
            </div>
        </main>
        </div>
    );
}
