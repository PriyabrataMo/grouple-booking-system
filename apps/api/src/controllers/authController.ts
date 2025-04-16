import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import dotenv from "dotenv";
import {
  AuthResponse,
  JwtPayload,
  UserDTO,
  UserRole,
} from "../types/user.types";
import {
  TypedRequestBody,
  LoginRequest,
  SignupRequest,
  AuthenticatedRequest,
} from "../types/express.types";
import { tokenBlacklist } from "../utils/tokenBlacklist";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE || "86400000");
const NODE_ENV = process.env.NODE_ENV || "development";

// Register a new user
export const signup = async (
  req: TypedRequestBody<SignupRequest>,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      ...(fullName ? { fullName } : {}),
      role: (role === "admin" ? "admin" : "user") as UserRole,
    });

    // Generate JWT token
    const payload: JwtPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    // Use type assertion to fix type issues with jwt.sign
    const token = jwt.sign(payload, String(JWT_SECRET), {
      expiresIn: "1d",
    });

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "strict",
    });

    // Return user data (without password)
    const userData: UserDTO = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      ...(newUser.fullName ? { fullName: newUser.fullName } : {}),
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const response: AuthResponse = {
      message: "User registered successfully",
      user: userData,
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user
export const login = async (
  req: TypedRequestBody<LoginRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Use type assertion to fix type issues with jwt.sign
    const token = jwt.sign(payload, String(JWT_SECRET), {
      expiresIn: "1d",
    });

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "strict",
    });

    // Return user data (without password)
    const userData: UserDTO = {
      id: user.id,
      username: user.username,
      email: user.email,
      ...(user.fullName ? { fullName: user.fullName } : {}),
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response: AuthResponse = {
      message: "Login successful",
      user: userData,
      token,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Logout user
export const logout = (req: Request, res: Response): void => {
  try {
    // Get token from cookie or authorization header
    const token =
      req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      // Get token expiration from JWT
      const decoded = jwt.decode(token) as JwtPayload;
      const expiryTimestamp =
        decoded?.exp || Math.floor(Date.now() / 1000) + 3600;

      // Add token to blacklist
      tokenBlacklist.addToken(token, expiryTimestamp);
    }

    // Clear the cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// Get current user info
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // User ID comes from the auth middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
