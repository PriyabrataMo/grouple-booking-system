import { Response } from "express";
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
import {
  getPasswordStrengthErrors,
  isValidEmail,
  isValidUsername,
  sanitizeInput,
  escapeSqlWildcards,
} from "../utils/validations";

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
    let { username, email, password, fullName, role } = req.body;

    // Validate and sanitize inputs
    const validationErrors: Record<string, string[]> = {};

    // Sanitize inputs
    username = sanitizeInput(username);
    email = email?.trim();
    if (fullName) {
      fullName = sanitizeInput(fullName);
    }

    // Validate username
    if (!isValidUsername(username)) {
      validationErrors.username = [
        "Username must be 3-20 characters and contain only letters, numbers, and underscore",
      ];
    }

    // Validate email
    if (!isValidEmail(email)) {
      validationErrors.email = ["Please provide a valid email address"];
    }

    // Validate password strength
    const passwordErrors = getPasswordStrengthErrors(password);
    if (passwordErrors.length > 0) {
      validationErrors.password = passwordErrors;
    }

    // If validation fails, return error
    if (Object.keys(validationErrors).length > 0) {
      res.status(422).json({
        message: "Validation failed",
        errors: validationErrors,
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: escapeSqlWildcards(email),
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    // Check for duplicate username
    const existingUsername = await User.findOne({
      where: {
        username: escapeSqlWildcards(username),
      },
    });

    if (existingUsername) {
      res.status(400).json({ message: "Username already taken" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for stronger hashing
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine user role
    let userRole: UserRole = "user";
    if (role === "admin") {
      userRole = role;
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      ...(fullName ? { fullName } : {}),
      role: userRole,
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
    const { email, password, isAdmin } = req.body;

    // Basic validation
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();

    // Rate limiting could be added here

    // Find user by email
    const user = await User.findOne({
      where: {
        email: escapeSqlWildcards(sanitizedEmail),
      },
    });

    if (!user) {
      // Use the same error message for security
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Consider implementing a delay here for security against timing attacks
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 100)
      );

      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // If admin login is requested, check if user has admin role
    if (isAdmin && user.role !== "admin") {
      res.status(403).json({ message: "Not authorized as admin" });
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
export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      // Add token to blacklist
      const decodedToken = jwt.verify(token, String(JWT_SECRET)) as JwtPayload;
      const expiryTimestamp = decodedToken.exp || 0;

      // Add token to blacklist until expiry time
      tokenBlacklist.addToken(token, expiryTimestamp);

      // Clear cookie
      res.clearCookie("token");
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// Get current user
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

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
