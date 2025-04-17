import { Server as SocketIoServer } from "socket.io";
import { Server as HttpServer } from "http";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "../models/ChatMessage";
import Booking from "../models/Booking";
import Restaurant from "../models/Restaurant";

// Interface for chat messages
interface ChatMessageData {
  id: string;
  restaurantId: string;
  bookingId: string;
  senderId: string;
  sender: string;
  message: string;
  timestamp: Date;
}

// Interface for connected clients
interface ConnectedClient {
  socket: any;
  userId: string;
  username: string;
  bookingId: string;
  role: string;
}

class ChatService {
  private io: SocketIoServer | null = null;
  private connectedClients: ConnectedClient[] = [];
  private messageHistory: Map<string, ChatMessageData[]> = new Map(); // bookingId -> messages
  private bookingAuthorizations: Map<
    string,
    { customerId: string; adminId: string; restaurantId: string }
  > = new Map(); // bookingId -> {customerId, adminId}

  constructor() {
    // Initialize message history with empty arrays
    this.messageHistory = new Map();
    this.bookingAuthorizations = new Map();
  }

  // Initialize socket.io server
  async initialize(server: HttpServer) {
    this.io = new SocketIoServer(server, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? "https://yourdomain.com"
            : ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000, // Increase timeout to 60 seconds
      pingInterval: 25000, // Check connection every 25 seconds
    });

    // Load booking authorizations
    await this.loadBookingAuthorizations();

    // Load message history from database for all bookings
    await this.loadMessageHistoryFromDatabase();

    this.setupEventHandlers();
    console.log("Chat service initialized");
  }

  // Load booking authorizations
  private async loadBookingAuthorizations() {
    try {
      // Get all bookings with their restaurant and user information
      const bookings = await Booking.findAll({
        include: [{ model: Restaurant, attributes: ["id", "userId"] }],
      });

      // Store authorization data for each booking
      for (const booking of bookings) {
        if (booking.restaurantId) {
          this.bookingAuthorizations.set(booking.id.toString(), {
            customerId: booking.userId.toString(),
            adminId: booking.restaurantId.toString(),
            restaurantId: booking.restaurantId.toString(),
          });
        }
      }

      console.log(`Loaded authorizations for ${bookings.length} bookings`);
    } catch (error) {
      console.error("Error loading booking authorizations:", error);
    }
  }

  // Load message history from database for all bookings
  private async loadMessageHistoryFromDatabase() {
    try {
      // Get all unique booking IDs that have chat messages
      const bookings = await ChatMessage.findAll({
        attributes: ["bookingId"],
        group: ["bookingId"],
      });

      // For each booking, load its message history
      for (const booking of bookings) {
        const bookingId = booking.bookingId.toString();
        await this.loadBookingMessageHistory(bookingId);
      }

      console.log(
        `Loaded chat history for ${bookings.length} bookings from database`
      );
    } catch (error) {
      console.error("Error loading message history from database:", error);
    }
  }

  // Load message history for a specific booking from database
  private async loadBookingMessageHistory(bookingId: string) {
    try {
      const messages = await ChatMessage.findAll({
        where: { bookingId: parseInt(bookingId) },
        order: [["timestamp", "ASC"]],
      });

      // Convert DB messages to the ChatMessageData format and store in memory
      const formattedMessages = messages.map((message) => ({
        id: message.id,
        restaurantId: message.restaurantId.toString(),
        bookingId: bookingId,
        senderId: message.senderId,
        sender: message.sender,
        message: message.message,
        timestamp: message.timestamp,
      }));

      this.messageHistory.set(bookingId, formattedMessages);
      console.log(
        `Loaded ${formattedMessages.length} messages for booking ${bookingId}`
      );
    } catch (error) {
      console.error(
        `Error loading message history for booking ${bookingId}:`,
        error
      );
      // Initialize with empty array if loading fails
      this.messageHistory.set(bookingId, []);
    }
  }

  // Save a message to the database
  private async saveMessageToDatabase(message: ChatMessageData) {
    try {
      await ChatMessage.create({
        id: message.id,
        restaurantId: parseInt(message.restaurantId),
        bookingId: parseInt(message.bookingId),
        senderId: message.senderId,
        sender: message.sender,
        message: message.message,
        timestamp: message.timestamp,
      });
      console.log(`Message saved to database: ${message.id}`);
    } catch (error) {
      console.error("Error saving message to database:", error);
    }
  }

  // Check if user is authorized to access the booking chat
  private async isAuthorizedForBookingChat(
    bookingId: string,
    userId: string,
    role: string,
    restaurantUserId?: string
  ): Promise<boolean> {
    try {
      console.log(
        `Authorization check - bookingId: ${bookingId}, userId: ${userId}, role: ${role}, restaurantUserId: ${restaurantUserId || "none"}`
      );

      // Get the booking with related restaurant
      const booking = await Booking.findByPk(parseInt(bookingId), {
        include: [{ model: Restaurant }],
      });

      if (!booking) {
        console.error(`Booking ${bookingId} not found`);
        return false;
      }

      // Case 1: If user is the customer who created the booking
      if (role === "user" && booking.userId.toString() === userId) {
        console.log(`User ${userId} authorized as booking creator`);
        return true;
      }

      // Case 2: If user is an admin and restaurantUserId matches the restaurant's userId
      if (role === "admin" && restaurantUserId) {
        if (userId === restaurantUserId) {
          console.log(
            `Admin ${userId} authorized as owner of restaurant ${booking.restaurantId}`
          );
          return true;
        }
      }

      // Special case for debugging - allow all connections if we're in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `WARNING: Allowing unauthorized access in development mode for user ${userId} to booking ${bookingId}`
        );
        return true;
      }

      console.error(
        `User ${userId} with role ${role} not authorized for booking ${bookingId}`
      );
      return false;
    } catch (error) {
      console.error(
        `Error checking authorization for booking ${bookingId}:`,
        error
      );
      return false;
    }
  }

  // Set up WebSocket event handlers
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Get user info from query parameters
      const userId = socket.handshake.query.userId as string;
      const username = socket.handshake.query.username as string;
      const bookingId = socket.handshake.query.bookingId as string;
      const role = socket.handshake.query.role as string;
      const restaurantUserId = socket.handshake.query
        .restaurantUserId as string;

      console.log(
        `User connected: ${username}, ID: ${userId}, Booking ID: ${bookingId}, Role: ${role}, Restaurant User ID: ${restaurantUserId || "none"}`
      );

      if (!userId || !username || !bookingId || !role) {
        console.error("Missing required connection parameters");
        socket.emit("error", { message: "Missing required parameters" });
        socket.disconnect();
        return;
      }

      // Check if the user is authorized to access this booking's chat
      this.isAuthorizedForBookingChat(
        bookingId as string,
        userId as string,
        role as string,
        restaurantUserId
      )
        .then((isAuthorized) => {
          if (!isAuthorized) {
            console.error(
              `User ${userId} not authorized for booking ${bookingId} chat`
            );
            socket.emit("error", {
              message: "You are not authorized to access this chat",
            });
            socket.emit("accessDenied");
            socket.disconnect();
            return;
          }

          // Get restaurant ID for this booking
          const bookingAuth = this.bookingAuthorizations.get(
            bookingId as string
          );

          // If no booking auth found, try to create it on the fly rather than disconnecting
          if (!bookingAuth) {
            console.warn(
              `No booking authorization data found for booking ${bookingId}. Attempting to load on demand.`
            );

            // Try to fetch the booking and set up the auth data
            Booking.findByPk(parseInt(bookingId), {
              include: [{ model: Restaurant }],
            })
              .then((booking) => {
                if (booking && booking.restaurantId) {
                  // Create a temporary auth record
                  this.bookingAuthorizations.set(bookingId, {
                    customerId: booking.userId.toString(),
                    adminId: booking.Restaurant
                      ? booking.Restaurant.userId.toString()
                      : "",
                    restaurantId: booking.restaurantId.toString(),
                  });

                  console.log(
                    `Created booking auth data for booking ${bookingId}`
                  );
                  this.handleAuthorizedConnection(
                    socket,
                    userId,
                    username,
                    bookingId,
                    role
                  );
                } else {
                  console.error(
                    `Failed to load booking data for booking ${bookingId}`
                  );
                  socket.emit("error", { message: "Booking data not found" });
                  socket.disconnect();
                }
              })
              .catch((error) => {
                console.error(
                  `Error loading booking ${bookingId} for auth:`,
                  error
                );
                socket.emit("error", { message: "Error loading booking data" });
                socket.disconnect();
              });
          } else {
            // If we have the auth data already, proceed normally
            this.handleAuthorizedConnection(
              socket,
              userId,
              username,
              bookingId,
              role
            );
          }
        })
        .catch((error) => {
          console.error("Error during authorization check:", error);
          socket.emit("error", {
            message: "Server error during authentication",
          });
          socket.disconnect();
        });
    });
  }

  // Handle the connection after authorization
  private handleAuthorizedConnection(
    socket: any,
    userId: string,
    username: string,
    bookingId: string,
    role: string
  ) {
    // Store client connection
    this.connectedClients.push({
      socket,
      userId,
      username,
      bookingId,
      role,
    });

    // Initialize message history for booking if not exists
    if (!this.messageHistory.has(bookingId)) {
      this.messageHistory.set(bookingId, []);

      // Try to load message history from the database if it's not already loaded
      this.loadBookingMessageHistory(bookingId);
    }

    // Send message history to client
    const history = this.messageHistory.get(bookingId) || [];
    socket.emit("history", history);

    // Join the booking's room
    socket.join(bookingId);
    console.log(`User ${username} joined booking room ${bookingId}`);

    // Send a system message that user has connected
    if (this.io) {
      this.io.to(bookingId).emit("userJoined", {
        username,
        timestamp: new Date(),
      });
    }

    // Handle new messages
    socket.on(
      "sendMessage",
      async (data: {
        bookingId: string;
        senderId: string;
        sender: string;
        message: string;
      }) => {
        try {
          // Get restaurant ID for this booking
          let auth = this.bookingAuthorizations.get(data.bookingId);

          // If no auth exists yet, try to find the restaurant ID from the booking
          if (!auth) {
            const booking = await Booking.findByPk(parseInt(data.bookingId), {
              include: [{ model: Restaurant }],
            });

            if (booking && booking.restaurantId) {
              const authData = {
                customerId: booking.userId.toString(),
                adminId: booking.Restaurant
                  ? booking.Restaurant.userId.toString()
                  : "",
                restaurantId: booking.restaurantId.toString(),
              };
              auth = authData;
              this.bookingAuthorizations.set(data.bookingId, authData);
            } else {
              console.error(
                `Could not find restaurant for booking ${data.bookingId}`
              );
              return;
            }
          }

          const newMessage: ChatMessageData = {
            id: uuidv4(),
            restaurantId: auth.restaurantId,
            bookingId: data.bookingId,
            senderId: data.senderId,
            sender: data.sender,
            message: data.message,
            timestamp: new Date(),
          };

          // Store message in memory history
          const bookingHistory = this.messageHistory.get(data.bookingId) || [];
          bookingHistory.push(newMessage);
          this.messageHistory.set(data.bookingId, bookingHistory);

          // Save message to database
          await this.saveMessageToDatabase(newMessage);

          // Broadcast message to clients in this booking room
          this.io?.to(data.bookingId).emit("message", newMessage);

          console.log(
            `New message from ${data.sender} in booking ${data.bookingId}: ${data.message}`
          );
        } catch (error) {
          console.error(
            `Error handling message for booking ${data.bookingId}:`,
            error
          );
          socket.emit("error", { message: "Failed to process message" });
        }
      }
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      this.connectedClients = this.connectedClients.filter(
        (client) => client.socket.id !== socket.id
      );

      // Notify others that user has left
      this.io?.to(bookingId).emit("userLeft", {
        username,
        timestamp: new Date(),
      });
    });
  }

  // Get active clients for a booking
  getActiveClients(bookingId: string): ConnectedClient[] {
    return this.connectedClients.filter(
      (client) => client.bookingId === bookingId
    );
  }

  // Get message history for a booking
  getMessageHistory(bookingId: string): ChatMessageData[] {
    return this.messageHistory.get(bookingId) || [];
  }

  // Clear message history for a booking (admin function)
  async clearMessageHistory(
    bookingId: string,
    adminId: string
  ): Promise<boolean> {
    // Verify admin is authorized
    const auth = this.bookingAuthorizations.get(bookingId);
    if (!auth || auth.adminId !== adminId) {
      console.error(
        `User ${adminId} not authorized to clear history for booking ${bookingId}`
      );
      return false;
    }

    try {
      // Delete from database
      await ChatMessage.destroy({
        where: { bookingId: parseInt(bookingId) },
      });

      // Clear from memory
      this.messageHistory.set(bookingId, []);

      // Notify all clients in the room that history was cleared
      this.io?.to(bookingId).emit("history", []);

      console.log(`Cleared message history for booking ${bookingId}`);
      return true;
    } catch (error) {
      console.error(
        `Error clearing message history for booking ${bookingId}:`,
        error
      );
      return false;
    }
  }
}

// Create and export singleton instance
const chatService = new ChatService();
export default chatService;
