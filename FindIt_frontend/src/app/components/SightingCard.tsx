import {ImageWithFallback} from "./figma/ImageWithFallback";

interface SightingCardProps {
    uploaderName: string;
    uploaderAvatar: string;
    imageUrl: string;
    note: string;
    timestamp: string;
} // You can adjust the types as needed, e.g., using Date for timestamp if you want to handle it differently.

export function SightingCard({ uploaderName, uploaderAvatar, imageUrl, note, timestamp }: SightingCardProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex gap-3 mb-3">
            <ImageWithFallback
            src={uploaderAvatar}
            alt={uploaderName}
            className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">{uploaderName}</p>
            <p className="text-xs text-gray-500">{timestamp}</p>
            </div>
        </div>
        
        <ImageWithFallback
            src={imageUrl}
            alt="Sighting"
            className="w-full h-32 object-cover rounded-lg mb-3"
        />
        
        <p className="text-sm text-gray-700">{note}</p>
        </div>
    );
}
// This component can be used in your Home page or any other page where you want to display sightings. 
// Just pass the appropriate props to it.