interface ChatMessageProps {
    message: string;
    timestamp: string;
    isSender: boolean;
}
// This component represents a single chat message, displaying the message content, timestamp, 
// and styling based on whether the message is sent by the user or received from others.

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
// The Chat Message component takes in three props:
// 'message' (the content of the chat message), 
// 'timestamp' (the time the message was sent), and
// 'isSender' (a boolean indicating if the message was sent by the user).
// It uses conditional styling to differentiate between sent and received messages, aligning them accordingly and applying different background colors.