import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateToken);

// Routes with double type assertion to ensure type safety
router.get("/", getBookings as unknown as express.RequestHandler);
router.get("/:id", getBookingById as unknown as express.RequestHandler);
router.post("/", createBooking as unknown as express.RequestHandler);
router.put("/:id", updateBooking as unknown as express.RequestHandler);
router.delete("/:id", deleteBooking as unknown as express.RequestHandler);

export default router;
