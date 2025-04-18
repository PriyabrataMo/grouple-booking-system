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

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve a list of bookings (filtered by user role)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", getBookings as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user does not own booking or lacks permission)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getBookingById as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error (e.g., invalid date, table unavailable)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Restaurant or Table not found
 *       500:
 *         description: Server error
 */
router.post("/", createBooking as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update an existing booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingUpdateInput'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user cannot update this booking)
 *       404:
 *         description: Booking, Restaurant or Table not found
 *       500:
 *         description: Server error
 */
router.put("/:id", updateBooking as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Booking ID
 *     responses:
 *       204:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (user cannot delete this booking)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteBooking as unknown as express.RequestHandler);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         tableId:
 *           type: string
 *           format: uuid
 *         bookingTime:
 *           type: string
 *           format: date-time
 *         numberOfGuests:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         User:
 *           $ref: '#/components/schemas/User' # Assuming User schema is defined elsewhere (e.g., authRoutes)
 *         Restaurant:
 *           $ref: '#/components/schemas/Restaurant' # Assuming Restaurant schema is defined elsewhere (e.g., restaurantRoutes)
 *         RestaurantTable:
 *           $ref: '#/components/schemas/RestaurantTable' # Assuming RestaurantTable schema is defined elsewhere (e.g., restaurantRoutes)
 *     BookingInput:
 *       type: object
 *       required:
 *         - restaurantId
 *         - tableId
 *         - bookingTime
 *         - numberOfGuests
 *       properties:
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         tableId:
 *           type: string
 *           format: uuid
 *         bookingTime:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 format date and time
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *     BookingUpdateInput:
 *       type: object
 *       properties:
 *         bookingTime:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 format date and time
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 */
