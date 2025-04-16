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
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get(
  "/me",
  authenticateToken,
  getCurrentUser as unknown as RequestHandler
);

export default router;
