import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getBookings,
  deleteBooking,
  updateBooking,
  Booking,
} from "../utils/bookingApi";
import type { BookingStatus } from "../types/booking";
import { getRestaurantById, Restaurant } from "../utils/restaurantApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const StaffBookingsPage: React.FC = () => {
  const { id: restaurantIdParam } = useParams<{ id: string }>();
  const restaurantId = restaurantIdParam ? parseInt(restaurantIdParam) : 0;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Load restaurant and its bookings on component mount
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

    if (!restaurantId) {
      navigate("/staff/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch restaurant details
        const restaurantData = await getRestaurantById(restaurantId);

        // Check if this restaurant belongs to the logged in admin
        if (restaurantData.userId !== user.id) {
          navigate("/staff/dashboard");
          return;
        }

        setRestaurant(restaurantData);

        // Fetch all bookings
        const allBookings = await getBookings();

        // Filter bookings for this restaurant
        const restaurantBookings = allBookings.filter(
          (booking) => booking.restaurantId === restaurantId
        );

        // Sort bookings by date (newest first)
        restaurantBookings.sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateB.getTime() - dateA.getTime();
        });

        setBookings(restaurantBookings);
        setError(null);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to load restaurant data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, navigate, user, restaurantId]);

  const handleDeleteBooking = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteBooking(id);
        // Remove the deleted booking from state
        setBookings(bookings.filter((booking) => booking.id !== id));
        setSuccessMessage("Booking deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to delete booking");
      }
    }
  };

  const handleUpdateStatus = async (id: number, status: BookingStatus) => {
    try {
      await updateBooking(id, { status });

      // Update booking in state
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status } : booking
        )
      );

      setSuccessMessage(`Booking ${status} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to update booking status");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge class based on booking status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          to="/staff/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {restaurant
            ? `Bookings for ${restaurant.name}`
            : "Restaurant Bookings"}
        </h1>
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
      ) : bookings.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">
            No bookings found for this restaurant.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.User?.username || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {booking.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(booking.startTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(booking.endTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.RestaurantTable
                      ? `Table ${booking.RestaurantTable.tableNumber}`
                      : "Not assigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.guestCount || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(booking.status)}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-2">
                      {/* Status update buttons */}
                      <div className="flex space-x-2">
                        {booking.status !== "confirmed" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "confirmed")
                            }
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Confirm
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "cancelled")
                            }
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                        {booking.status !== "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "pending")
                            }
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                          >
                            Set as Pending
                          </button>
                        )}
                      </div>

                      {/* View detail button */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffBookingsPage;
