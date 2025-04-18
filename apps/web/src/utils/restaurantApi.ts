import api from "./api";
import { BookingStatus } from "../types/booking";
import { getErrorMessage } from "../types/errors";

// Custom RestaurantApiError class to handle restaurant specific errors
export class RestaurantApiError extends Error {
  status?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "RestaurantApiError";
    this.status = status;
    this.details = details;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RestaurantApiError);
    }
  }
}

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  description?: string;
  cuisine: string;
  openingTime: string;
  closingTime: string;
  imageUrl?: string;
  userId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  User?: {
    id: number;
    username: string;
    email: string;
  };
  RestaurantTables?: RestaurantTable[];
}

export interface RestaurantTable {
  id: number;
  restaurantId: number;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface RestaurantCreateInput {
  name: string;
  address: string;
  description?: string;
  cuisine: string;
  openingTime: string;
  closingTime: string;
  imageUrl?: string;
}

export interface RestaurantUpdateInput {
  name?: string;
  address?: string;
  description?: string;
  cuisine?: string;
  openingTime?: string;
  closingTime?: string;
  imageUrl?: string;
}

export interface TableCreateInput {
  tableNumber: number;
  capacity: number;
  isAvailable?: boolean;
}

export interface TableUpdateInput {
  tableNumber?: number;
  capacity?: number;
  isAvailable?: boolean;
}

export interface RestaurantBookingInput {
  restaurantId: number;
  tableId?: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  status?: BookingStatus;
  guestCount: number;
}

export interface RestaurantParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RestaurantPaginatedResponse {
  restaurants: Restaurant[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Get all restaurants
export const getRestaurants = async (
  params?: RestaurantParams
): Promise<RestaurantPaginatedResponse> => {
  try {
    const response = await api.get("/restaurants", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Get a specific restaurant by ID
export const getRestaurantById = async (id: number): Promise<Restaurant> => {
  try {
    const response = await api.get(`/restaurants/${id}`);
    return response.data.restaurant;
  } catch (error) {
    console.error(`Error fetching restaurant ${id}:`, error);
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Create a new restaurant
export const createRestaurant = async (
  restaurantData: RestaurantCreateInput | FormData,
  isFormData: boolean = false
): Promise<Restaurant> => {
  try {
    const headers = isFormData
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" };

    const response = await api.post("/restaurants", restaurantData, {
      headers,
    });
    return response.data.restaurant;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Update a restaurant
export const updateRestaurant = async (
  id: number,
  restaurantData: RestaurantUpdateInput | FormData,
  isFormData: boolean = false
): Promise<Restaurant> => {
  try {
    const headers = isFormData
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" };

    const response = await api.put(`/restaurants/${id}`, restaurantData, {
      headers,
    });
    return response.data.restaurant;
  } catch (error) {
    console.error(`Error updating restaurant ${id}:`, error);
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Delete a restaurant
export const deleteRestaurant = async (id: number): Promise<void> => {
  try {
    await api.delete(`/restaurants/${id}`);
  } catch (error) {
    console.error(`Error deleting restaurant ${id}:`, error);
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Get tables for a specific restaurant
export const getRestaurantTables = async (
  restaurantId: number
): Promise<RestaurantTable[]> => {
  try {
    const response = await api.get(`/restaurants/${restaurantId}/tables`);
    return response.data.tables;
  } catch (error) {
    console.error(
      `Error fetching tables for restaurant ${restaurantId}:`,
      error
    );
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Create a table for a restaurant
export const createRestaurantTable = async (
  restaurantId: number,
  tableData: TableCreateInput
): Promise<RestaurantTable> => {
  try {
    const response = await api.post(
      `/restaurants/${restaurantId}/tables`,
      tableData
    );
    return response.data.table;
  } catch (error) {
    console.error(
      `Error creating table for restaurant ${restaurantId}:`,
      error
    );
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Update a table
export const updateRestaurantTable = async (
  restaurantId: number,
  tableId: number,
  tableData: TableUpdateInput
): Promise<RestaurantTable> => {
  try {
    const response = await api.put(
      `/restaurants/${restaurantId}/tables/${tableId}`,
      tableData
    );
    return response.data.table;
  } catch (error) {
    console.error(
      `Error updating table ${tableId} for restaurant ${restaurantId}:`,
      error
    );
    throw new RestaurantApiError(getErrorMessage(error));
  }
};

// Delete a table
export const deleteRestaurantTable = async (
  restaurantId: number,
  tableId: number
): Promise<void> => {
  try {
    await api.delete(`/restaurants/${restaurantId}/tables/${tableId}`);
  } catch (error) {
    console.error(
      `Error deleting table ${tableId} for restaurant ${restaurantId}:`,
      error
    );
    throw new RestaurantApiError(getErrorMessage(error));
  }
};
