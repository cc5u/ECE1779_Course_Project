import { X } from 'lucide-react';

interface StatusConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StatusConfirmationModal({ isOpen, onClose, onConfirm }: StatusConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Status Update</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-8">
          Mark this item as found? This will update the status and notify users who have shown interest.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
