import api from "./api";
import { BookingStatus } from "../types/booking";

export interface Booking {
  id: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status: BookingStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  User?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface BookingCreateInput {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  userId?: number; // Optional, will be set by the server for normal users
}

export interface BookingUpdateInput {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: BookingStatus;
}

// Get all bookings (admin) or user's bookings
export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await api.get("/bookings");
    return response.data.bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Get a specific booking by ID
export const getBookingById = async (id: number): Promise<Booking> => {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data.booking;
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error);
    throw error;
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
    throw error;
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
    throw error;
  }
};

// Delete a booking
export const deleteBooking = async (id: number): Promise<void> => {
  try {
    await api.delete(`/bookings/${id}`);
  } catch (error) {
    console.error(`Error deleting booking ${id}:`, error);
    throw error;
  }
};
