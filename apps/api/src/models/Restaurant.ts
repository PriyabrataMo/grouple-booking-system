import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import { RestaurantAttributes } from "../types/restaurant.types";

// Define Restaurant model class
class Restaurant
  extends Model<RestaurantAttributes>
  implements RestaurantAttributes
{
  public id!: number;
  public name!: string;
  public address!: string;
  public description!: string;
  public cuisine!: string;
  public openingTime!: string;
  public closingTime!: string;
  public imageUrl!: string;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model with attributes and options
Restaurant.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cuisine: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    openingTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    closingTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "restaurants",
    timestamps: true,
  }
);

export default Restaurant;
