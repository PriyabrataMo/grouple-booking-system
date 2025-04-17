import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Restaurant from "./Restaurant";
import Booking from "./Booking";

// Chat message interface defining required attributes
export interface ChatMessageAttributes {
  id: string;
  restaurantId: number;
  bookingId: number; // Added bookingId
  senderId: string;
  sender: string;
  message: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define ChatMessage model class
class ChatMessage
  extends Model<ChatMessageAttributes>
  implements ChatMessageAttributes
{
  public id!: string;
  public restaurantId!: number;
  public bookingId!: number; // Added bookingId
  public senderId!: string;
  public sender!: string;
  public message!: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model with attributes and options
ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    bookingId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Booking,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "chat_messages",
    timestamps: true,
    indexes: [
      {
        name: "restaurant_index",
        fields: ["restaurantId"],
      },
      {
        name: "booking_index",
        fields: ["bookingId"],
      },
    ],
  }
);

// Define associations
ChatMessage.belongsTo(Restaurant, { foreignKey: "restaurantId" });
Restaurant.hasMany(ChatMessage, { foreignKey: "restaurantId" });

ChatMessage.belongsTo(Booking, { foreignKey: "bookingId" });
Booking.hasMany(ChatMessage, { foreignKey: "bookingId" });

export default ChatMessage;
