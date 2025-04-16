/**
 * Booking-related type definitions
 */

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface BookingAttributes {
  id?: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingDTO {
  id: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingCreateInput {
  userId: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: BookingStatus;
}

export interface BookingUpdateInput {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: BookingStatus;
}
