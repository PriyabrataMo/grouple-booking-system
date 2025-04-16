import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Restaurant from "./Restaurant";
import { TableAttributes } from "../types/restaurant.types";

// Define RestaurantTable model class
class RestaurantTable
  extends Model<TableAttributes>
  implements TableAttributes
{
  public id!: number;
  public restaurantId!: number;
  public tableNumber!: number;
  public capacity!: number;
  public isAvailable!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize RestaurantTable model
RestaurantTable.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    restaurantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Restaurant, // Changed from string to model reference
        key: "id",
      },
      onDelete: "CASCADE", // Add cascade delete
    },
    tableNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "restaurant_tables",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["restaurantId", "tableNumber"],
      },
    ],
  }
);

// Define associations
RestaurantTable.belongsTo(Restaurant, { foreignKey: "restaurantId" });
Restaurant.hasMany(RestaurantTable, { foreignKey: "restaurantId" });

export default RestaurantTable;
