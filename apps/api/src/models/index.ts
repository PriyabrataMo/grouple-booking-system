import sequelize, { testConnection } from "../config/database";
import User from "./User";
import Booking from "./Booking";

// Initialize database and sync models
export const initDatabase = async (): Promise<void> => {
  try {
    // Test the connection first
    await testConnection();

    // Sync all models with the database
    // Using simple sync instead of alter to avoid "Too many keys" error
    // Note: In production, you should use migrations instead of sync
    await sequelize.sync();
    console.log("✅ All models were synchronized successfully.");
  } catch (error) {
    console.error("❌ Unable to sync database:", error);
    throw error;
  }
};

// Export models
export { sequelize, User, Booking };
