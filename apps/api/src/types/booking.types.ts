/**
 * Booking-related type definitions
 */

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface BookingAttributes {
  id?: number;
  userId: number;
  restaurantId: number;
  tableId?: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  guestCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingDTO {
  id: number;
  userId: number;
  restaurantId: number;
  tableId?: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  guestCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingCreateInput {
  userId: number;
  restaurantId: number;
  tableId?: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: BookingStatus;
  guestCount: number;
}

export interface BookingUpdateInput {
  title?: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: BookingStatus;
  tableId?: number;
  guestCount?: number;
}
