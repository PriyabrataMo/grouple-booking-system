import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getBookingById, Booking } from "../utils/bookingApi";
import { io, Socket } from "socket.io-client";
import { MessageSquare, Send, User, ArrowLeft, Loader } from "lucide-react";

// Chat message interface
interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  timestamp: Date;
  bookingId: string;
}

const UserChatPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        const bookingData = await getBookingById(parseInt(bookingId));
        setBooking(bookingData);
        if (bookingData.Restaurant) {
          setRestaurantName(bookingData.Restaurant.name);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Could not load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Connect to WebSocket server
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!bookingId || !user || !booking || !booking.Restaurant) return;

    const userId = user.id.toString();
    const username = user.username || user.fullName || user.email;

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

    // Connect to WebSocket server
    const socket = io(socketUrl, {
      query: {
        bookingId,
        userId,
        username,
        role: "user",
        restaurantUserId: booking.Restaurant?.userId?.toString() || "", // Add restaurantUserId parameter
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
      console.log("User connected to chat server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setReconnecting(true);
      console.log("User disconnected from chat server");

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

    socket.on(
      "userJoined",
      (notification: { username: string; timestamp: Date }) => {
        // Add system message about user joining
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: "System",
          senderId: "system",
          message: `${notification.username} has joined the chat`,
          timestamp: new Date(notification.timestamp),
          bookingId: bookingId,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    );

    socket.on(
      "userLeft",
      (notification: { username: string; timestamp: Date }) => {
        // Add system message about user leaving
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          sender: "System",
          senderId: "system",
          message: `${notification.username} has left the chat`,
          timestamp: new Date(notification.timestamp),
          bookingId: bookingId,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    );

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socket) {
        console.log("Disconnecting socket on cleanup");
        socket.disconnect();
      }
    };
  }, [isLoggedIn, user, bookingId, booking, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !socketRef.current || !user) return;

    console.log(`Sending message to booking ${bookingId}`);

    // Emit message to server with booking ID
    socketRef.current.emit("sendMessage", {
      bookingId,
      senderId: user.id.toString(),
      sender: user.username || user.fullName || user.email,
      message: messageInput.trim(),
    });

    setMessageInput("");
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 hover:bg-blue-700 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold flex items-center">
          <MessageSquare className="mr-2" />
          Chat with {restaurantName}
          {reconnecting && (
            <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
              Reconnecting...
            </span>
          )}
          {connected && (
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </h1>
      </header>

      {/* Connection Status */}
      {!connected && reconnecting && booking && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center flex items-center justify-center">
          <Loader className="animate-spin mr-2" size={16} />
          Connecting to chat server...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-center">{error}</div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={64} className="mb-4" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">
              Start a conversation with the restaurant staff about your booking.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === "system"
                  ? "justify-center"
                  : msg.senderId === user?.id.toString()
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderId === "system"
                    ? "bg-gray-100 text-gray-600 text-sm py-1"
                    : msg.senderId === user?.id.toString()
                      ? "bg-blue-100 text-blue-900"
                      : "bg-white border border-gray-200"
                }`}
              >
                {msg.senderId !== "system" && (
                  <div className="flex items-center mb-1">
                    {msg.senderId !== user?.id.toString() && (
                      <User size={14} className="mr-1 text-gray-500" />
                    )}
                    <span className="font-semibold text-sm">{msg.sender}</span>
                  </div>
                )}
                <p
                  className={`${msg.senderId === "system" ? "text-center" : "mb-1"}`}
                >
                  {msg.message}
                </p>
                {msg.senderId !== "system" && (
                  <p className="text-xs text-gray-500 text-right">
                    {formatTimestamp(msg.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-gray-200"
      >
        {!connected && booking && (
          <div className="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm">
            {reconnecting
              ? "Disconnected from chat server. Reconnecting..."
              : "Unable to connect to chat server. Please try again later."}
          </div>
        )}
        <div className="flex rounded-lg border overflow-hidden">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-3 focus:outline-none"
            disabled={!connected}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            disabled={!connected || !messageInput.trim()}
          >
            <Send size={18} className="mr-1" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserChatPage;
