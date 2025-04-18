import { Response } from "express";
import { Restaurant, User, RestaurantTable } from "../models";
import {
  RestaurantCreateInput,
  RestaurantUpdateInput,
  TableCreateInput,
  TableUpdateInput,
} from "../types/restaurant.types";
import {
  AuthenticatedRequest,
  AuthenticatedRequestBody,
} from "../types/express.types";
import { uploadFileToS3, deleteFileFromS3 } from "../utils/s3";

// Get all restaurants with pagination and sorting
export const getRestaurants = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Parse sorting parameters
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder = (req.query.sortOrder as string) || "asc";

    // Validate sort field to prevent SQL injection
    const validSortFields = ["name", "cuisine", "createdAt", "updatedAt"];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : "name";

    // Validate sort order
    const validatedSortOrder = ["asc", "desc"].includes(sortOrder)
      ? sortOrder
      : "asc";

    // Set where clause based on user role
    let whereClause = {};

    // For admin users, only show restaurants they created
    if (role === "admin") {
      whereClause = { userId };
    }
    // For regular users, show all restaurants (no where clause)

    // Get total count for pagination with the appropriate where clause
    const count = await Restaurant.count({ where: whereClause });

    // Fetch restaurants with pagination and sorting
    const restaurants = await Restaurant.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: RestaurantTable },
      ],
      order: [[validatedSortBy, validatedSortOrder.toUpperCase()]],
      limit,
      offset,
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      restaurants,
      totalCount: count,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error getting restaurants:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching restaurants" });
  }
};

// Get a specific restaurant by ID
export const getRestaurantById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id || "0");

    if (isNaN(restaurantId)) {
      res.status(400).json({ message: "Invalid restaurant ID" });
      return;
    }

    // Find the restaurant
    const restaurant = await Restaurant.findByPk(restaurantId, {
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: RestaurantTable },
      ],
    });

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    res.status(200).json({ restaurant });
  } catch (error) {
    console.error("Error getting restaurant:", error);
    res.status(500).json({ message: "Server error while fetching restaurant" });
  }
};

// Create a new restaurant (admin only)
export const createRestaurant = async (
  req: AuthenticatedRequestBody<RestaurantCreateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;

    // Only admins can create restaurants
    if (role !== "admin") {
      res.status(403).json({ message: "Not authorized to create restaurants" });
      return;
    }

    const restaurantData = req.body;

    // Handle image upload if a file is included
    if (req.file) {
      try {
        const imageUrl = await uploadFileToS3(req.file);
        restaurantData.imageUrl = imageUrl;
      } catch (uploadError) {
        console.error("S3 upload error:", uploadError);
        // Continue without the image if upload fails
        res.status(207).json({
          message: "Restaurant created, but image upload failed",
          error: (uploadError as Error).message,
        });
        // Don't return here, continue with restaurant creation
      }
    }

    // Create the restaurant
    const newRestaurant = await Restaurant.create({
      ...restaurantData,
      userId,
    });

    res.status(201).json({
      message: "Restaurant created successfully",
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ message: "Server error while creating restaurant" });
  }
};

// Update a restaurant (admin only)
export const updateRestaurant = async (
  req: AuthenticatedRequestBody<RestaurantUpdateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const restaurantId = parseInt(req.params.id || "0");
    const updateData = req.body;

    if (isNaN(restaurantId) || restaurantId <= 0) {
      res.status(400).json({ message: "Invalid restaurant ID" });
      return;
    }

    // Find the restaurant
    const restaurant = await Restaurant.findByPk(restaurantId);

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Only the admin who owns the restaurant can update it
    if (role !== "admin" || restaurant.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to update this restaurant" });
      return;
    }

    // Handle image upload if a file is included
    if (req.file) {
      try {
        const imageUrl = await uploadFileToS3(req.file);
        updateData.imageUrl = imageUrl;
      } catch (uploadError) {
        console.error("S3 upload error:", uploadError);
        // Continue without updating the image if upload fails
        res.status(207).json({
          message: "Restaurant updated, but image upload failed",
          error: (uploadError as Error).message,
        });
        // Don't return here, continue with restaurant update
      }
    }

    // Update the restaurant
    await restaurant.update(updateData);

    res.status(200).json({
      message: "Restaurant updated successfully",
      restaurant,
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Server error while updating restaurant" });
  }
};

// Delete a restaurant (admin only)
export const deleteRestaurant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const restaurantId = parseInt(req.params.id || "0");

    if (isNaN(restaurantId) || restaurantId <= 0) {
      res.status(400).json({ message: "Invalid restaurant ID" });
      return;
    }

    // Find the restaurant
    const restaurant = await Restaurant.findByPk(restaurantId);

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Only admin who owns the restaurant can delete it
    if (role !== "admin" || restaurant.userId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this restaurant" });
      return;
    }

    // Delete associated image from S3 if it exists
    if (restaurant.imageUrl) {
      try {
        const deleteResult = await deleteFileFromS3(restaurant.imageUrl);
        if (deleteResult) {
          console.log(
            `Successfully deleted image for restaurant ${restaurantId}`
          );
        } else {
          console.warn(`Failed to delete image for restaurant ${restaurantId}`);
        }
      } catch (imageError) {
        console.error(
          `Error deleting image for restaurant ${restaurantId}:`,
          imageError
        );
        // Continue with restaurant deletion even if image deletion fails
      }
    }

    // Delete the restaurant
    await restaurant.destroy();

    res.status(200).json({
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ message: "Server error while deleting restaurant" });
  }
};

// Get tables for a specific restaurant
export const getRestaurantTables = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id || "0");

    if (isNaN(restaurantId)) {
      res.status(400).json({ message: "Invalid restaurant ID" });
      return;
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Get all tables for the restaurant
    const tables = await RestaurantTable.findAll({
      where: { restaurantId },
      order: [["tableNumber", "ASC"]],
    });

    res.status(200).json({ tables });
  } catch (error) {
    console.error("Error getting restaurant tables:", error);
    res.status(500).json({ message: "Server error while fetching tables" });
  }
};

// Create a table for a restaurant (admin only)
export const createTable = async (
  req: AuthenticatedRequestBody<TableCreateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const restaurantId = parseInt(req.params.id || "0");
    const tableData = req.body;

    if (isNaN(restaurantId)) {
      res.status(400).json({ message: "Invalid restaurant ID" });
      return;
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Only admins who own the restaurant can create tables
    if (role !== "admin" || restaurant.userId !== userId) {
      res.status(403).json({
        message: "Not authorized to create tables for this restaurant",
      });
      return;
    }

    // Create the table
    const newTable = await RestaurantTable.create({
      ...tableData,
      restaurantId,
      isAvailable: tableData.isAvailable ?? true, // Provide default value if not specified
    });

    res.status(201).json({
      message: "Table created successfully",
      table: newTable,
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ message: "Server error while creating table" });
  }
};

// Update a table (admin only)
export const updateTable = async (
  req: AuthenticatedRequestBody<TableUpdateInput>,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const restaurantId = parseInt(req.params.id || "0");
    const tableId = parseInt(req.params.tableId || "0");
    const updateData = req.body;

    if (isNaN(tableId) || tableId <= 0) {
      res.status(400).json({ message: "Invalid table ID" });
      return;
    }

    // Find the table
    const table = await RestaurantTable.findByPk(tableId);

    if (!table) {
      res.status(404).json({ message: "Table not found" });
      return;
    }

    // Make sure this table belongs to the restaurant
    if (table.restaurantId !== restaurantId) {
      res
        .status(400)
        .json({ message: "Table does not belong to the specified restaurant" });
      return;
    }

    // Get restaurant details for permission check
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Only admins who own the restaurant can update tables
    if (role !== "admin" || restaurant.userId !== userId) {
      res.status(403).json({
        message: "Not authorized to update tables for this restaurant",
      });
      return;
    }

    // Update the table
    await table.update(updateData);

    res.status(200).json({
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ message: "Server error while updating table" });
  }
};

// Delete a table (admin only)
export const deleteTable = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: userId, role } = req.user;
    const restaurantId = parseInt(req.params.id || "0");
    const tableId = parseInt(req.params.tableId || "0");

    if (isNaN(tableId) || tableId <= 0) {
      res.status(400).json({ message: "Invalid table ID" });
      return;
    }

    // Find the table
    const table = await RestaurantTable.findByPk(tableId);

    if (!table) {
      res.status(404).json({ message: "Table not found" });
      return;
    }

    // Make sure this table belongs to the restaurant
    if (table.restaurantId !== restaurantId) {
      res
        .status(400)
        .json({ message: "Table does not belong to the specified restaurant" });
      return;
    }

    // Get restaurant details for permission check
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Only admins who own the restaurant can delete tables
    if (role !== "admin" || restaurant.userId !== userId) {
      res.status(403).json({
        message: "Not authorized to delete tables for this restaurant",
      });
      return;
    }

    // Delete the table
    await table.destroy();

    res.status(200).json({
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ message: "Server error while deleting table" });
  }
};
