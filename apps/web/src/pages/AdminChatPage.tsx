import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getRestaurantById } from "../utils/restaurantApi";
import { getBookings, Booking } from "../utils/bookingApi";
import { io, Socket } from "socket.io-client";
import {
  MessageSquare,
  Send,
  User as UserIcon,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";

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

const AdminChatPage: React.FC = () => {
  const location = useLocation();
  const customerData = location.state as {
    customerId?: string;
    customerName?: string;
    bookingId?: number;
    bookingTitle?: string;
  } | null;

  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customerData?.customerId ?? null
  );
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>(
    customerData?.customerName ?? ""
  );
  const [showCustomers, setShowCustomers] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Fetch restaurant details and bookings
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        // Fetch restaurant details
        const restaurant = await getRestaurantById(parseInt(restaurantId));
        setRestaurantName(restaurant.name);

        // Fetch bookings for this restaurant
        const allBookings = await getBookings();
        const restaurantBookings = allBookings.filter(
          (b) => b.restaurantId === parseInt(restaurantId)
        );
        setBookings(restaurantBookings);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load restaurant details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  // Pre-select customer from location state if available
  useEffect(() => {
    if (customerData?.customerId && customerData?.customerName) {
      setSelectedCustomerId(customerData.customerId);
      setSelectedCustomerName(customerData.customerName);
      console.log(
        `Pre-selected customer: ${customerData.customerName} (${customerData.customerId})`
      );
    }
  }, [customerData]);

  // Connect to WebSocket server
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin" && user?.role !== "staff") {
      navigate("/");
      return;
    }

    // We need both a selected booking ID and user to proceed
    if (!user || !customerData?.bookingId) return;

    // Get the booking ID from customerData
    const bookingId = customerData.bookingId.toString();

    // Disconnect previous socket if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log(`Connecting to chat server for booking ${bookingId}`);

    // Extract the base API URL correctly - remove "/api" if it exists
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const socketUrl = apiBaseUrl.endsWith("/api")
      ? apiBaseUrl.substring(0, apiBaseUrl.length - 4)
      : apiBaseUrl;

    console.log("Connecting to Socket.IO server at:", socketUrl);

    // Connect to WebSocket server with the correct parameters
    const socket = io(socketUrl, {
      query: {
        bookingId,
        userId: user.id.toString(),
        username: `${user.username || user.fullName || user.email}`,
        role: "admin", // Explicitly set role to admin
        restaurantUserId: user.id.toString(), // Pass admin's userId as restaurantUserId
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
      console.log("Admin connected to chat server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setReconnecting(true);
      console.log("Admin disconnected from chat server");

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
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("history", (messageHistory: ChatMessage[]) => {
      console.log(
        `Received message history: ${messageHistory.length} messages`
      );
      setMessages(messageHistory);
      setLoading(false);
    });

    socket.on("userJoined", (notification: SystemNotification) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message: `${notification.username} has joined the chat`,
        timestamp: new Date(notification.timestamp),
        bookingId: "",
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    socket.on("userLeft", (notification: SystemNotification) => {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: "System",
        senderId: "system",
        message: `${notification.username} has left the chat`,
        timestamp: new Date(notification.timestamp),
        bookingId: "",
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

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
  }, [isLoggedIn, user, customerData, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !messageInput.trim() ||
      !socketRef.current ||
      !user ||
      !customerData?.bookingId
    )
      return;

    const bookingId = customerData.bookingId.toString();
    console.log(`Sending message to booking ${bookingId}`);

    // Emit message to server with booking ID
    socketRef.current.emit("sendMessage", {
      bookingId,
      senderId: user.id.toString(),
      sender: `${user.username || user.fullName || user.email}`,
      message: messageInput.trim(),
    });

    setMessageInput("");
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSelectCustomer = (booking: Booking) => {
    if (booking.User) {
      // Update selected customer
      setSelectedCustomerId(booking.User.id.toString());
      setSelectedCustomerName(booking.User.username || booking.User.email);
      setShowCustomers(false);

      // Update the customerData with the new booking information
      const newCustomerData = {
        customerId: booking.User.id.toString(),
        customerName: booking.User.username || booking.User.email,
        bookingId: booking.id,
        bookingTitle: booking.title,
      };

      // Store the updated customerData in location.state
      window.history.replaceState(
        { ...location.state, ...newCustomerData },
        document.title
      );

      // Reconnect the socket with the new booking ID
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // We need to manually trigger a reconnection with the new bookingId
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000";
      const socketUrl = apiBaseUrl.endsWith("/api")
        ? apiBaseUrl.substring(0, apiBaseUrl.length - 4)
        : apiBaseUrl;

      if (user) {
        console.log(`Connecting to chat for booking ${booking.id}`);

        // Connect to WebSocket server with the new booking ID
        const socket = io(socketUrl, {
          query: {
            bookingId: booking.id.toString(),
            userId: user.id.toString(),
            username: `${user.username || user.fullName || user.email}`,
            role: "admin", // Explicitly set role to admin
            restaurantUserId: user.id.toString(), // Pass admin's userId as restaurantUserId
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        // Re-initialize all socket event handlers
        socket.on("connect", () => {
          setConnected(true);
          setReconnecting(false);
          console.log("Admin connected to chat server");
        });

        socket.on("disconnect", () => {
          setConnected(false);
          setReconnecting(true);
          console.log("Admin disconnected from chat server");

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
          setMessages((prev) => [...prev, newMessage]);
        });

        socket.on("history", (messageHistory: ChatMessage[]) => {
          console.log(
            `Received message history: ${messageHistory.length} messages`
          );
          setMessages(messageHistory);
          setLoading(false);
        });

        socket.on("userJoined", (notification: SystemNotification) => {
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            sender: "System",
            senderId: "system",
            message: `${notification.username} has joined the chat`,
            timestamp: new Date(notification.timestamp),
            bookingId: booking.id.toString(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        });

        socket.on("userLeft", (notification: SystemNotification) => {
          const systemMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            sender: "System",
            senderId: "system",
            message: `${notification.username} has left the chat`,
            timestamp: new Date(notification.timestamp),
            bookingId: booking.id.toString(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        });
      }
    }
  };

  const filteredMessages = selectedCustomerId
    ? messages.filter(
        (msg) =>
          msg.senderId === selectedCustomerId ||
          msg.senderId === user?.id.toString() ||
          msg.senderId === "system"
      )
    : messages;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 hover:bg-indigo-700 p-2 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold flex items-center">
            <MessageSquare className="mr-2" />
            Chat for {restaurantName}
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
          </h1>
        </div>

        {/* Customer Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCustomers(!showCustomers)}
            className="flex items-center bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded text-sm"
          >
            {selectedCustomerId
              ? `Chatting with: ${selectedCustomerName}`
              : "Select Customer"}
            {showCustomers ? (
              <ChevronUp size={16} className="ml-2" />
            ) : (
              <ChevronDown size={16} className="ml-2" />
            )}
          </button>

          {showCustomers && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
              <div className="max-h-60 overflow-y-auto py-1">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <button
                      key={booking.id}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleSelectCustomer(booking)}
                    >
                      <div className="font-medium">
                        {booking.User?.username ||
                          booking.User?.email ||
                          "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Booking: {booking.title}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No customers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {reconnecting ? (
              <>
                <Loader className="animate-spin h-8 w-8 mb-4 text-indigo-500" />
                <p className="text-lg">Connecting to chat server...</p>
              </>
            ) : (
              <>
                <MessageSquare size={64} className="mb-4" />
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">
                  {selectedCustomerId
                    ? `Start a conversation with ${selectedCustomerName}`
                    : "Select a customer to chat with"}
                </p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((msg) => (
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
                className={`${
                  msg.senderId === "system"
                    ? "bg-gray-200 text-center text-xs text-gray-600 px-3 py-1 rounded-full max-w-[80%]"
                    : msg.senderId === user?.id.toString()
                      ? "bg-indigo-100 text-indigo-900 max-w-[70%] rounded-lg p-3"
                      : "bg-white border border-gray-200 max-w-[70%] rounded-lg p-3"
                }`}
              >
                {msg.senderId !== "system" && (
                  <div className="flex items-center mb-1">
                    {msg.senderId !== user?.id.toString() && (
                      <UserIcon size={14} className="mr-1 text-gray-500" />
                    )}
                    <span className="font-semibold text-sm">{msg.sender}</span>
                  </div>
                )}
                <p className={msg.senderId === "system" ? "" : "mb-1"}>
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
        {!connected && (
          <div className="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm">
            {reconnecting
              ? "Disconnected from chat server. Trying to reconnect..."
              : "Unable to connect to chat server. Please try again later."}
          </div>
        )}
        <div className="flex rounded-lg border overflow-hidden">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              selectedCustomerId
                ? "Type your message here..."
                : "Select a customer to chat with..."
            }
            className="flex-1 p-3 focus:outline-none"
            disabled={!connected || !selectedCustomerId}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
            disabled={!connected || !messageInput.trim() || !selectedCustomerId}
          >
            <Send size={18} className="mr-1" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminChatPage;
