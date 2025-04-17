import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getRestaurantById,
  Restaurant,
  RestaurantTable,
} from "../utils/restaurantApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const fetchRestaurantData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getRestaurantById(parseInt(id));
        setRestaurant(data);
        setError(null);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to load restaurant details");
        console.error("Error fetching restaurant details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [id, isLoggedIn, navigate]);

  // Format time for display
  const formatTime = (timeString: string) => {
    // If time is in HH:MM format, convert to 12-hour format
    if (timeString && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString || "N/A";
  };

  const isAdmin = user?.role === "admin";
  const isOwner = isAdmin && restaurant?.userId === user?.id;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        {isOwner ? (
          <Link
            to={`/restaurants`}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Dashboard
          </Link>
        ) : (
          <Link
            to={`/restaurants`}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Restaurants
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : restaurant ? (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            {restaurant.imageUrl && (
              <div className="w-full h-64 relative">
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {restaurant.cuisine} Cuisine
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Address</h2>
                <p className="text-gray-700">{restaurant.address}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Operating Hours</h2>
                <p className="text-gray-700">
                  {formatTime(restaurant.openingTime)} -{" "}
                  {formatTime(restaurant.closingTime)}
                </p>
              </div>

              {restaurant.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-700">{restaurant.description}</p>
                </div>
              )}

              {restaurant.RestaurantTables &&
                restaurant.RestaurantTables.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">
                      Available Tables
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Table Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Capacity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {restaurant.RestaurantTables.map(
                            (table: RestaurantTable) => (
                              <tr key={table.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {table.tableNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {table.capacity} people
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      table.isAvailable
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {table.isAvailable
                                      ? "Available"
                                      : "Occupied"}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex flex-wrap gap-4 justify-between">
              {/* Show Make Reservation button only for users with role "user" */}
              {user?.role === "user" && (
                <Link
                  to={`/restaurants/${restaurant.id}/book`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Make a Reservation
                </Link>
              )}

              {/* Show management buttons for admin or restaurant owner */}
              {(isAdmin || isOwner) && (
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={`/restaurants/${restaurant.id}/edit`}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                  >
                    Edit Restaurant
                  </Link>
                  <Link
                    to={`/restaurants/${restaurant.id}/tables/manage`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Manage Tables
                  </Link>
                  {isOwner && (
                    <Link
                      to={`/admin/bookings`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Manage Bookings
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">Restaurant not found.</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailPage;
