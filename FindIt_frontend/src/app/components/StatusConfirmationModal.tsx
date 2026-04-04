import { X } from 'lucide-react';

interface StatusConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  confirmButtonClassName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function StatusConfirmationModal({
  isOpen,
  title = 'Confirm Status Update',
  message = 'Mark this item as found? This will update the status and notify users who have shown interest.',
  confirmLabel = 'Confirm',
  isConfirming = false,
  confirmButtonClassName = 'bg-green-600 hover:bg-green-700',
  onClose,
  onConfirm,
}: StatusConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-8">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-8 py-2.5 text-white rounded-lg transition-colors font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${confirmButtonClassName}`}
          >
            {isConfirming ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
// The StatusConfirmationModal component is a modal dialog that prompts the user to confirm a status update action.
// It takes three props:
// 'isOpen' (a boolean that determines if the modal is visible),
// 'onClose' (a function to close the modal), and
// 'onConfirm' (a function to execute when the user confirms the action).
// The modal includes a header, a message explaining the action, and two buttons for canceling or confirming the update.
