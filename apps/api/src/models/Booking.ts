import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Restaurant from "./Restaurant";
import RestaurantTable from "./RestaurantTable";
import { BookingAttributes, BookingStatus } from "../types/booking.types";

// Define Booking model class
class Booking extends Model<BookingAttributes> implements BookingAttributes {
  public id!: number;
  public userId!: number;
  public restaurantId!: number;
  public tableId?: number;
  public title!: string;
  public description?: string;
  public startTime!: Date;
  public endTime!: Date;
  public status!: BookingStatus;
  public guestCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public Restaurant?: Restaurant;
}

// Initialize the model with attributes and options
Booking.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    restaurantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Restaurant,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tableId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: RestaurantTable,
        key: "id",
      },
      onDelete: "SET NULL", // If table is deleted, set tableId to null
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    guestCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: "bookings",
    timestamps: true,
  }
);

// Define associations
Booking.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Booking, { foreignKey: "userId" });

Booking.belongsTo(Restaurant, { foreignKey: "restaurantId" });
Restaurant.hasMany(Booking, { foreignKey: "restaurantId" });

Booking.belongsTo(RestaurantTable, { foreignKey: "tableId" });
RestaurantTable.hasMany(Booking, { foreignKey: "tableId" });

export default Booking;
