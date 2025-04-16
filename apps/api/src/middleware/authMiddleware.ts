import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { JwtPayload } from "../types/user.types";
import { AuthenticatedRequest } from "../types/express.types";
import { tokenBlacklist } from "../utils/tokenBlacklist";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Middleware to verify JWT token
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get token from cookie or authorization header
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.isBlacklisted(token)) {
    res.status(401).json({ message: "Token has been invalidated" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Add user info to request object
    (req as AuthenticatedRequest).user = decoded;

    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check user role
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      res
        .status(403)
        .json({ message: "You don't have permission to access this resource" });
      return;
    }
    next();
  };
};
