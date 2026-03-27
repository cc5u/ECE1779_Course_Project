import { ImageWithFallback } from './figma/ImageWithFallback.tsx';

interface ReportCardProps {
  itemName: string;
  location: string;
  time: string;
  status: 'Lost' | 'Possibly Found';
  imageUrl: string;
  onClick?: () => void;
}

export function ReportCard({ itemName, location, time, status, imageUrl, onClick }: ReportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <ImageWithFallback
            src={imageUrl}
            alt={itemName}
            className="w-16 h-16 rounded-full object-cover bg-gray-100"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{itemName}</h3>
          <p className="text-sm text-gray-600 mb-1 truncate">{location}</p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
        
        <div className="flex-shrink-0">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              status === 'Lost'
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    </button>
  );
}

// This component is used to display a report card for a lost item.
// It takes in props for the item name, location, time, status, and image URL.
// It uses the ImageWithFallback component to display the image, and applies different styles based on the status of the item.

