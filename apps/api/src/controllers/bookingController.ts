import { Response } from "express";
import { Booking, User, Restaurant, RestaurantTable } from "../models";
import { BookingCreateInput, BookingUpdateInput } from "../types/booking.types";
import {
  AuthenticatedRequest,
  AuthenticatedRequestBody,
} from "../types/express.types";
import {
  ApiError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../utils/errors";
import { bookingCacheService } from "../services/bookingCacheService";

// Get all bookings (admin) or user's bookings
export const getBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;

    // Try to get from cache first based on user role
    let bookings;
    if (role === "admin") {
      bookings = await bookingCacheService.getAdminBookings();
    } else {
      bookings = await bookingCacheService.getUserBookings(userId.toString());
    }

    // If cache hit, return the cached data
    if (bookings) {
      res.status(200).json({ bookings });
      return;
    }

    // Cache miss, fetch from database
    // If admin, get all bookings, otherwise get only user's bookings
    const where = role === "admin" ? {} : { userId };

    bookings = await Booking.findAll({
      where,
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: Restaurant },
        { model: RestaurantTable },
      ],
      order: [["startTime", "DESC"]],
    });

    // Cache the fetched data
    if (role === "admin") {
      await bookingCacheService.cacheAdminBookings(bookings);
    } else {
      await bookingCacheService.cacheUserBookings(userId.toString(), bookings);
    }

    res.status(200).json({ bookings });
  } catch (error: any) {
    console.error("Error getting bookings:", error);

    // Use custom error types based on the specific error
    if (error.name === "SequelizeConnectionError") {
      const apiError = new InternalServerError("Database connection error");
      res.status(apiError.status).json(apiError.toJSON());
    } else if (error.name === "SequelizeAssociationError") {
      const apiError = new InternalServerError("Error with model associations");
      res.status(apiError.status).json(apiError.toJSON());
    } else if (error.name === "SequelizeValidationError") {
      // Handle Sequelize validation errors
      const errors: { [key: string]: string[] } = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: { path: string; message: string }) => {
          if (err.path) {
            if (!errors[err.path]) {
              errors[err.path] = [];
            }
            errors[err.path]?.push(err.message);
          }
        });
      }
      const apiError = new BadRequestError("Validation error", errors);
      res.status(apiError.status).json(apiError.toJSON());
    } else if (error instanceof ApiError) {
      // If it's already an ApiError, use it directly
      res.status(error.status).json(error.toJSON());
    } else {
      // Default server error
      const apiError = new InternalServerError(
        "Server error while fetching bookings"
      );
      res.status(apiError.status).json(apiError.toJSON());
    }
  }
};

// Get a specific booking by ID
export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const bookingId = parseInt(req.params.id || "0");

    if (isNaN(bookingId)) {
      throw new BadRequestError("Invalid booking ID");
    }

    // Try to get from cache first
    const cachedBooking = await bookingCacheService.getBookingById(
      bookingId.toString()
    );
    let booking;

    if (cachedBooking) {
      // Cache hit, use cached data
      booking = cachedBooking;
    } else {
      // Cache miss, fetch from database
      booking = await Booking.findByPk(bookingId, {
        include: [
          { model: User, attributes: ["id", "username", "email"] },
          { model: Restaurant },
          { model: RestaurantTable },
        ],
      });

      // Cache the fetched data
      if (booking) {
        await bookingCacheService.cacheBooking(bookingId.toString(), booking);
      }
    }

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Check if the user is authorized to view this booking
    if (role !== "admin" && booking.userId !== userId) {
      throw new ForbiddenError("Not authorized to access this booking");
    }

    res.status(200).json({ booking });
  } catch (error: any) {
    console.error("Error getting booking:", error);

    if (error instanceof ApiError) {
      res.status(error.status).json(error.toJSON());
    } else {
      const apiError = new InternalServerError(
        "Server error while fetching booking"
      );
      res.status(apiError.status).json(apiError.toJSON());
    }
  }
};

// Create a new booking
export const createBooking = async (
  req: AuthenticatedRequestBody<BookingCreateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId } = req.user;
    let bookingData = req.body;

    // If not admin, force the userId to be the current user's ID
    if (req.user.role !== "admin") {
      bookingData = { ...bookingData, userId };
    }

    // Validate booking times
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestError("Invalid start or end time");
    }

    if (startTime >= endTime) {
      throw new BadRequestError("End time must be after start time");
    }

    // Create the booking
    const newBooking = await Booking.create({
      ...bookingData,
      userId: bookingData.userId || userId,
      startTime,
      endTime,
      status: "pending",
    });

    // Invalidate relevant caches after creating a booking
    await bookingCacheService.invalidateBookingCache("user", userId.toString());
    if (newBooking.restaurantId) {
      await bookingCacheService.invalidateBookingCache(
        "restaurant",
        newBooking.restaurantId.toString()
      );
    }
    await bookingCacheService.invalidateBookingCache("all");

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);

    if (error instanceof ApiError) {
      res.status(error.status).json(error.toJSON());
    } else if (error.name === "SequelizeValidationError") {
      // Handle Sequelize validation errors
      const errors: { [key: string]: string[] } = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: { path: string; message: string }) => {
          if (err.path) {
            if (!errors[err.path]) {
              errors[err.path] = [];
            }
            errors[err.path]?.push(err.message);
          }
        });
      }
      const apiError = new BadRequestError("Validation error", errors);
      res.status(apiError.status).json(apiError.toJSON());
    } else {
      const apiError = new InternalServerError(
        "Server error while creating booking"
      );
      res.status(apiError.status).json(apiError.toJSON());
    }
  }
};

// Update a booking
export const updateBooking = async (
  req: AuthenticatedRequestBody<BookingUpdateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const bookingId = parseInt(req.params.id || "0");
    const updateData = req.body;

    if (isNaN(bookingId) || bookingId <= 0) {
      throw new BadRequestError("Invalid booking ID");
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Check if the user is authorized to update this booking
    if (role !== "admin" && booking.userId !== userId) {
      throw new ForbiddenError("Not authorized to update this booking");
    }

    // Validate booking times if provided
    if (updateData.startTime && updateData.endTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = new Date(updateData.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestError("Invalid start or end time");
      }

      if (startTime >= endTime) {
        throw new BadRequestError("End time must be after start time");
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;
    } else if (updateData.startTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = booking.endTime;

      if (isNaN(startTime.getTime())) {
        throw new BadRequestError("Invalid start time");
      }

      if (startTime >= endTime) {
        throw new BadRequestError("End time must be after start time");
      }

      updateData.startTime = startTime;
    } else if (updateData.endTime) {
      const startTime = booking.startTime;
      const endTime = new Date(updateData.endTime);

      if (isNaN(endTime.getTime())) {
        throw new BadRequestError("Invalid end time");
      }

      if (startTime >= endTime) {
        throw new BadRequestError("End time must be after start time");
      }

      updateData.endTime = endTime;
    }

    // Update the booking
    // Convert updateData to a format compatible with the model's update method
    const sanitizedUpdateData: Partial<Booking> = {};

    // Only add fields that are present in updateData
    if (updateData.title !== undefined)
      sanitizedUpdateData.title = updateData.title;
    if (updateData.description !== undefined)
      sanitizedUpdateData.description = updateData.description;
    if (updateData.startTime !== undefined)
      sanitizedUpdateData.startTime =
        updateData.startTime instanceof Date
          ? updateData.startTime
          : new Date(updateData.startTime);
    if (updateData.endTime !== undefined)
      sanitizedUpdateData.endTime =
        updateData.endTime instanceof Date
          ? updateData.endTime
          : new Date(updateData.endTime);
    if (updateData.status !== undefined)
      sanitizedUpdateData.status = updateData.status;

    await booking.update(sanitizedUpdateData);

    // Fetch the updated booking with all related data
    const updatedBooking = await Booking.findByPk(bookingId, {
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: Restaurant },
        { model: RestaurantTable },
      ],
    });

    // Invalidate caches after update
    await bookingCacheService.invalidateBookingCache(bookingId.toString());

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("Error updating booking:", error);

    if (error instanceof ApiError) {
      res.status(error.status).json(error.toJSON());
    } else if (error.name === "SequelizeValidationError") {
      // Handle Sequelize validation errors
      const errors: { [key: string]: string[] } = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: { path: string; message: string }) => {
          if (err.path) {
            if (!errors[err.path]) {
              errors[err.path] = [];
            }
            errors[err.path]?.push(err.message);
          }
        });
      }
      const apiError = new BadRequestError("Validation error", errors);
      res.status(apiError.status).json(apiError.toJSON());
    } else {
      const apiError = new InternalServerError(
        "Server error while updating booking"
      );
      res.status(apiError.status).json(apiError.toJSON());
    }
  }
};

// Delete a booking
export const deleteBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const bookingId = parseInt(req.params.id || "0");

    if (isNaN(bookingId) || bookingId <= 0) {
      throw new BadRequestError("Invalid booking ID");
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new NotFoundError("Booking");
    }

    // Check if the user is authorized to delete this booking
    if (role !== "admin" && booking.userId !== userId) {
      throw new ForbiddenError("Not authorized to delete this booking");
    }

    // Store booking info before deletion for cache invalidation
    const bookingUserId = booking.userId;
    const restaurantId = booking.restaurantId;

    // Delete the booking
    await booking.destroy();

    // Invalidate caches after deletion
    await bookingCacheService.invalidateBookingCache(bookingId.toString());
    await bookingCacheService.invalidateBookingCache(
      "user",
      bookingUserId.toString()
    );
    if (restaurantId) {
      await bookingCacheService.invalidateBookingCache(
        "restaurant",
        restaurantId.toString()
      );
    }
    await bookingCacheService.invalidateBookingCache("all");

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting booking:", error);

    if (error instanceof ApiError) {
      res.status(error.status).json(error.toJSON());
    } else {
      const apiError = new InternalServerError(
        "Server error while deleting booking"
      );
      res.status(apiError.status).json(apiError.toJSON());
    }
  }
};
