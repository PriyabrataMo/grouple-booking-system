/**
 * Restaurant-related type definitions
 */

export interface RestaurantAttributes {
  id?: number;
  name: string;
  address: string;
  description?: string;
  cuisine: string;
  openingTime: string;
  closingTime: string;
  imageUrl?: string;
  userId: number; // Owner/admin of the restaurant
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestaurantDTO {
  id: number;
  name: string;
  address: string;
  description?: string;
  cuisine: string;
  openingTime: string;
  closingTime: string;
  imageUrl?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantWithTables extends RestaurantDTO {
  Tables?: TableDTO[];
  User?: {
    id: number;
    username: string;
    email: string;
  };
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

/**
 * Restaurant Table-related type definitions
 */

export interface TableAttributes {
  id?: number;
  restaurantId: number;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TableDTO {
  id: number;
  restaurantId: number;
  tableNumber: number;
  capacity: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableCreateInput {
  restaurantId: number;
  tableNumber: number;
  capacity: number;
  isAvailable?: boolean;
}

export interface TableUpdateInput {
  tableNumber?: number;
  capacity?: number;
  isAvailable?: boolean;
}