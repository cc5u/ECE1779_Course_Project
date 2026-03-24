import { ImageWithFallback } from './figma/ImageWithFallback.tsx';
import type { ReactNode } from 'react';

interface ReportCardProps {
  itemName: string;
  location: string;
  time: string;
  status: 'Lost' | 'Possibly Found' | 'Found' | 'Archived';
  imageUrl: string;
  onClick?: () => void;
  actions?: ReactNode;
}

export function ReportCard({ itemName, location, time, status, imageUrl, onClick, actions }: ReportCardProps) {
  const statusClassName =
    status === 'Lost'
      ? 'bg-red-50 text-red-700'
      : status === 'Possibly Found'
        ? 'bg-green-50 text-green-700'
        : status === 'Found'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-gray-100 text-gray-700';

  const cardContent = (
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
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusClassName}`}>
          {status}
        </span>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full text-left"
        >
          {cardContent}
        </button>
      ) : (
        cardContent
      )}
      {actions ? (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

// This component is used to display a report card for a lost item.
// It takes in props for the item name, location, time, status, and image URL.
// It uses the ImageWithFallback component to display the image, and applies different styles based on the status of the item.

