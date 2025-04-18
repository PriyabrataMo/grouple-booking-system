import express from "express";
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantTables,
  createTable,
  updateTable,
  deleteTable,
} from "../controllers/restaurantController";
import { authenticateToken } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Restaurant routes
router.get("/", getRestaurants as unknown as express.RequestHandler);
router.get("/:id", getRestaurantById as unknown as express.RequestHandler);
router.post(
  "/",
  upload.single("image"),
  createRestaurant as unknown as express.RequestHandler
);
router.put(
  "/:id",
  upload.single("image"),
  updateRestaurant as unknown as express.RequestHandler
);
router.delete("/:id", deleteRestaurant as unknown as express.RequestHandler);

// Table routes
router.get(
  "/:id/tables",
  getRestaurantTables as unknown as express.RequestHandler
);
router.post("/:id/tables", createTable as unknown as express.RequestHandler);
router.put(
  "/:id/tables/:tableId",
  updateTable as unknown as express.RequestHandler
);
router.delete(
  "/:id/tables/:tableId",
  deleteTable as unknown as express.RequestHandler
);

export default router;
