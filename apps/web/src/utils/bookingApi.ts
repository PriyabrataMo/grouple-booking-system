import api from "./api";
import { getErrorMessage } from "../types/errors";
import { BookingStatus } from "../types/booking";

// Custom BookingApiError class to handle booking specific errors
export class BookingApiError extends Error {
  status?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BookingApiError";
    this.status = status;
    this.details = details;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BookingApiError);
    }
  }
}

// Restaurant interface for associated data
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
}

// RestaurantTable interface for associated data
export interface RestaurantTable {
  id: number;
  restaurantId: number;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  restaurantId?: number;
  tableId?: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus;
  guestCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  User?: {
    id: number;
    username: string;
    email: string;
  };
  Restaurant?: Restaurant;
  RestaurantTable?: RestaurantTable;
}

export interface BookingCreateInput {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  userId?: number; // Optional, will be set by the server for normal users
  restaurantId?: number;
  tableId?: number;
  guestCount?: number;
}

export interface BookingUpdateInput {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: BookingStatus;
  restaurantId?: number;
  tableId?: number;
  guestCount?: number;
}

// Get all bookings (admin) or user's bookings
export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await api.get("/bookings");

    // Check if response data has the expected structure
    if (!response.data || !Array.isArray(response.data.bookings)) {
      console.error("Unexpected response format:", response.data);
      return [];
    }

    return response.data.bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw new BookingApiError(getErrorMessage(error));
  }
};

// Get a specific booking by ID
export const getBookingById = async (id: number): Promise<Booking> => {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data.booking;
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error);
    throw new BookingApiError(getErrorMessage(error));
  }
};

// Create a new booking
export const createBooking = async (
  bookingData: BookingCreateInput
): Promise<Booking> => {
  try {
    const response = await api.post("/bookings", bookingData);
    return response.data.booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw new BookingApiError(getErrorMessage(error));
  }
};

// Update a booking
export const updateBooking = async (
  id: number,
  bookingData: BookingUpdateInput
): Promise<Booking> => {
  try {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data.booking;
  } catch (error) {
    console.error(`Error updating booking ${id}:`, error);
    throw new BookingApiError(getErrorMessage(error));
  }
};

// Delete a booking
export const deleteBooking = async (id: number): Promise<void> => {
  try {
    await api.delete(`/bookings/${id}`);
  } catch (error) {
    console.error(`Error deleting booking ${id}:`, error);
    throw new BookingApiError(getErrorMessage(error));
  }
};
