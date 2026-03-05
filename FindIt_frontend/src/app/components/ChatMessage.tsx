interface ChatMessageProps {
  message: string;
  timestamp: string;
  isSender: boolean;
}

export function ChatMessage({ message, timestamp, isSender }: ChatMessageProps) {
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-lg ${
            isSender
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1">{timestamp}</span>
      </div>
    </div>
  );
}
