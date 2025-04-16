import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import { BookingAttributes, BookingStatus } from "../types/booking.types";

// Define Booking model class
class Booking extends Model<BookingAttributes> implements BookingAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public description!: string;
  public startTime!: Date;
  public endTime!: Date;
  public status!: BookingStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Booking model
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
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(100),
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

export default Booking;
