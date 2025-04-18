import express from "express";
import { initDatabase } from "./models/index";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import authRoutes from "./routes/authRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";
import healthRoutes from "./routes/healthRoutes";
import chatService from "./services/chatService";
import { initRedis } from "./config/redis";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || "http://localhost:5173";
// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser

// CORS configuration
app.use(
  cors({
    origin: URL, // Allow requests from this origin
    credentials: true, // Allow cookies with CORS
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.get("/", (_, res) => {
  res.send("Hello, world!");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api", healthRoutes); // Mount health routes under /api prefix

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Initialize Redis cache
    await initRedis();

    // Initialize chat service (now async)
    await chatService.initialize(server);

    // Start server (use the HTTP server instead of Express app)
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server is also running`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
