import { Response } from "express";
import { Booking, User } from "../models";
import { BookingCreateInput, BookingUpdateInput } from "../types/booking.types";
import {
  AuthenticatedRequest,
  AuthenticatedRequestBody,
} from "../types/express.types";

// Get all bookings (admin) or user's bookings
export const getBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;

    // If admin, get all bookings, otherwise get only user's bookings
    const where = role === "admin" ? {} : { userId };

    const bookings = await Booking.findAll({
      where,
      include: [{ model: User, attributes: ["id", "username", "email"] }],
      order: [["startTime", "DESC"]],
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({ message: "Server error while fetching bookings" });
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
      res.status(400).json({ message: "Invalid booking ID" });
      return;
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: User, attributes: ["id", "username", "email"] }],
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check if the user is authorized to view this booking
    if (role !== "admin" && booking.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to access this booking" });
      return;
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({ message: "Server error while fetching booking" });
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
      res.status(400).json({ message: "Invalid start or end time" });
      return;
    }

    if (startTime >= endTime) {
      res.status(400).json({ message: "End time must be after start time" });
      return;
    }

    // Create the booking
    const newBooking = await Booking.create({
      ...bookingData,
      userId: bookingData.userId || userId,
      startTime,
      endTime,
      status: "pending",
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error while creating booking" });
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
      res.status(400).json({ message: "Invalid booking ID" });
      return;
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check if the user is authorized to update this booking
    if (role !== "admin" && booking.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
      return;
    }

    // Validate booking times if provided
    if (updateData.startTime && updateData.endTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = new Date(updateData.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        res.status(400).json({ message: "Invalid start or end time" });
        return;
      }

      if (startTime >= endTime) {
        res.status(400).json({ message: "End time must be after start time" });
        return;
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;
    } else if (updateData.startTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = booking.endTime;

      if (isNaN(startTime.getTime())) {
        res.status(400).json({ message: "Invalid start time" });
        return;
      }

      if (startTime >= endTime) {
        res.status(400).json({ message: "End time must be after start time" });
        return;
      }

      updateData.startTime = startTime;
    } else if (updateData.endTime) {
      const startTime = booking.startTime;
      const endTime = new Date(updateData.endTime);

      if (isNaN(endTime.getTime())) {
        res.status(400).json({ message: "Invalid end time" });
        return;
      }

      if (startTime >= endTime) {
        res.status(400).json({ message: "End time must be after start time" });
        return;
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

    res.status(200).json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error while updating booking" });
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
      res.status(400).json({ message: "Invalid booking ID" });
      return;
    }

    // Find the booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check if the user is authorized to delete this booking
    if (role !== "admin" && booking.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this booking" });
      return;
    }

    // Delete the booking
    await booking.destroy();

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error while deleting booking" });
  }
};
