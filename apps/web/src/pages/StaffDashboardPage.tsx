import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  getRestaurants,
  deleteRestaurant,
  Restaurant,
} from "../utils/restaurantApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const StaffDashboardPage: React.FC = () => {
  const [myRestaurants, setMyRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRestaurants();

      setMyRestaurants(response.restaurants);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load restaurants");
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load admin's restaurants on component mount
  useEffect(() => {
    // Check if user is logged in and is admin
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    // Check for success message from redirects
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }

    fetchRestaurants();
  }, [isLoggedIn, navigate, user, location, fetchRestaurants]);

  const handleDeleteRestaurant = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this restaurant? This will delete all associated tables and bookings."
      )
    ) {
      try {
        await deleteRestaurant(id);
        // Remove the deleted restaurant from state
        setMyRestaurants(
          myRestaurants.filter((restaurant) => restaurant.id !== id)
        );
        setSuccessMessage("Restaurant deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to delete restaurant");
      }
    }
  };

  // Format time for display (HH:MM to 12-hour format)
  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    // If time is in HH:MM format, convert to 12-hour format
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Restaurant Admin Dashboard</h1>
        <Link
          to="/restaurants/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Restaurant
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : myRestaurants.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">
            You don't have any restaurants yet.
          </p>
          <p className="mt-2 text-gray-500">
            Add a new restaurant to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200"
            >
              {restaurant.imageUrl && (
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">{restaurant.name}</h2>
                <p className="text-gray-600 mb-2">
                  {restaurant.cuisine} Cuisine
                </p>
                <p className="text-gray-600 mb-2">{restaurant.address}</p>
                <div className="text-gray-600 mb-4">
                  <span>Hours: </span>
                  <span>
                    {formatTime(restaurant.openingTime)} -{" "}
                    {formatTime(restaurant.closingTime)}
                  </span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <Link
                      to={`/restaurants/${restaurant.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/staff/restaurants/${restaurant.id}/bookings`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                      Manage Bookings
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <Link
                      to={`/restaurants/${restaurant.id}/edit`}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/restaurants/${restaurant.id}/tables/manage`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Manage Tables
                    </Link>
                    <button
                      onClick={() => handleDeleteRestaurant(restaurant.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffDashboardPage;
