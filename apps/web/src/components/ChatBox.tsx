import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { X, Loader } from "lucide-react";

// Chat message interface
interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  timestamp: Date;
  bookingId: string;
}

// System notification interface
interface SystemNotification {
  username: string;
  timestamp: Date;
}

interface ChatBoxProps {
  bookingId: string;
  userId: string;
  username: string;
  role: "user" | "admin";
  restaurantUserId: string;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  bookingId,
  userId,
  username,
  role,
  restaurantUserId,
  onClose,
}) => {
  console.log("ChatBox props:", {
    bookingId,
    userId,
    username,
    role,
    restaurantUserId,
    onClose,
  });
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!bookingId || !userId) return;

    console.log(`Connecting to chat server for booking ${bookingId}`);

    // Disconnect previous socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Extract the base API URL correctly - remove "/api" if it exists
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socketUrl = apiBaseUrl.endsWith("/api")
      ? apiBaseUrl.substring(0, apiBaseUrl.length - 4)
      : apiBaseUrl;

    console.log("Connecting to Socket.IO server at:", socketUrl);

    // Connect to WebSocket server with the correct URL and booking ID
    const socket = io(socketUrl, {
      query: {
        bookingId,
        userId,
        username,
        role,
        restaurantUserId, // Pass restaurantUserId to the server for validation
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
    });

    socketRef.current = socket;

    // Set up event listeners
    socket.on("connect", () => {
      setConnected(true);
      setReconnecting(false);
      console.log("Connected to chat server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from chat server");

      // Set reconnecting state
      setReconnecting(true);

      // Try to reconnect manually after a delay if socket.io reconnection fails
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("Attempting manual reconnection...");
        socket.connect();
      }, 5000);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setReconnecting(true);
    });

    socket.on("message", (newMessage: ChatMessage) => {
      console.log("New message received:", newMessage);
      // Only add the message if it's for this booking
      if (newMessage.bookingId === bookingId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    socket.on("history", (messageHistory: ChatMessage[]) => {
      console.log(
        `Received message history: ${messageHistory.length} messages`
      );
      setMessages(messageHistory);
    });

    socket.on("userJoined", (notification: SystemNotification) => {
      // Add system message about user joining
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message: `${notification.username} has joined the chat`,
        timestamp: new Date(notification.timestamp),
        bookingId,
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on("userLeft", (notification: SystemNotification) => {
      // Add system message about user leaving
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message: `${notification.username} has left the chat`,
        timestamp: new Date(notification.timestamp),
        bookingId,
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
      // Add system message about error
      const systemMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message: `Error: ${error.message}`,
        timestamp: new Date(),
        bookingId,
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on("accessDenied", () => {
      // Add system message about access being denied
      const systemMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message:
          "Access denied: You are not authorized to access this chat room",
        timestamp: new Date(),
        bookingId,
      };
      setMessages((prev) => [...prev, systemMessage]);

      // Close the chat window
      setTimeout(() => onClose(), 2000);
    });

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socket) {
        socket.disconnect();
      }
    };
  }, [bookingId, userId, username, role, restaurantUserId, onClose]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !socketRef.current) return;

    // Emit message to server with booking ID
    socketRef.current.emit("sendMessage", {
      bookingId,
      senderId: userId,
      sender: username,
      message: message.trim(),
    });

    setMessage("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl flex flex-col z-50 max-h-[500px]">
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-medium">
          Booking Chat
          {!connected && reconnecting && (
            <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
              Reconnecting...
            </span>
          )}
          {connected && (
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto h-80">
        {reconnecting && messages.length === 0 ? (
          <div className="text-gray-500 text-center py-4 flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 mb-2 text-blue-500" />
            <div>Connecting to chat server...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                msg.senderId === "system"
                  ? "bg-gray-200 mx-auto text-center text-xs text-gray-600"
                  : msg.senderId === userId
                    ? "bg-blue-100 ml-auto"
                    : "bg-gray-100"
              }`}
            >
              {msg.senderId !== "system" && (
                <div className="text-xs text-gray-500">
                  {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
              <div className="mt-1">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={!connected}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!connected || !message.trim()}
          >
            Send
          </button>
        </div>
        {!connected && (
          <div className="text-red-500 text-xs mt-1">
            {reconnecting
              ? "Disconnected from chat. Trying to reconnect..."
              : "Unable to connect to chat server. Please try again later."}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatBox;
