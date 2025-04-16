import sequelize, { testConnection } from "../config/database";
import User from "./User";
import Booking from "./Booking";
import Restaurant from "./Restaurant";
import RestaurantTable from "./RestaurantTable";

// Setup associations
// User associations
User.hasMany(Restaurant, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
Restaurant.belongsTo(User, {
  foreignKey: "userId",
});

User.hasMany(Booking, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
Booking.belongsTo(User, {
  foreignKey: "userId",
});

// Restaurant associations
Restaurant.hasMany(RestaurantTable, {
  foreignKey: "restaurantId",
  onDelete: "CASCADE",
});
RestaurantTable.belongsTo(Restaurant, {
  foreignKey: "restaurantId",
});

Restaurant.hasMany(Booking, {
  foreignKey: "restaurantId",
  onDelete: "CASCADE",
});
Booking.belongsTo(Restaurant, {
  foreignKey: "restaurantId",
});

// RestaurantTable associations
RestaurantTable.hasMany(Booking, {
  foreignKey: "tableId",
  onDelete: "SET NULL", // When a table is deleted, set tableId to null in bookings
});
Booking.belongsTo(RestaurantTable, {
  foreignKey: "tableId",
});

// Initialize database and sync models
export const initDatabase = async (): Promise<void> => {
  try {
    // Test the connection first
    await testConnection();

    // Sync all models with the database
    // Using alter in development mode to update table structures
    // Note: In production, you should use migrations instead of sync
    await sequelize.sync({ alter: true });

    console.log("✅ All models were synchronized successfully.");
  } catch (error) {
    console.error("❌ Unable to sync database:", error);
    throw error;
  }
};

// Export models
export { sequelize, User, Booking, Restaurant, RestaurantTable };
