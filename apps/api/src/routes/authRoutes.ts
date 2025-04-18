import express, { RequestHandler } from "express";
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

// Authentication routes
router.post("/signup", signup as unknown as RequestHandler);
router.post("/login", login as unknown as RequestHandler);
router.post("/logout", logout as unknown as RequestHandler);
router.get(
  "/me",
  authenticateToken,
  getCurrentUser as unknown as RequestHandler
);

export default router;
