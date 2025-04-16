/**
 * User-related type definitions
 */

export type UserRole = "admin" | "user";

export interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
  message: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
