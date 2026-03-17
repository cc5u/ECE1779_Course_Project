import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface UploadFoundItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string, note: string) => void;
}

export function UploadFoundItemModal({ isOpen, onClose, onSubmit }: UploadFoundItemModalProps) {
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewUrl) {
      onSubmit(previewUrl, note);
      setNote('');
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    }
  };

  const handleClose = () => {
    setNote('');
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Upload Found Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="foundImageUpload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label htmlFor="foundImageUpload" className="cursor-pointer">
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
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-gray-600">Upload evidence of found item</p>
                    <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="foundNote" className="block text-sm font-medium text-gray-900 mb-2">
              Note (optional)
            </label>
            <textarea
              id="foundNote"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional information about where or when you found this item..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// The UploadFoundItemModal component is a modal dialog that allows users to upload an image of a found item along with an optional note.
// It takes three props:
// 'isOpen' (a boolean that determines if the modal is visible),
// 'onClose' (a function to close the modal), and
// 'onSubmit' (a function that receives the image URL and note when the form is submitted).
// The component manages local state for the selected file, its preview URL, and the note input. It provides a user-friendly interface for uploading an image and adding details about the found item.