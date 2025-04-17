import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getBookings,
  updateBooking,
  deleteBooking,
  Booking,
} from "../utils/bookingApi";
import { getRestaurants, Restaurant } from "../utils/restaurantApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";
import { BookingStatus } from "../types/booking";
import { Loader } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import ChatBox from "../components/ChatBox";

const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | "all">(
    "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "all">(
    "all"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [isLoggedIn, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, restaurantsResponse] = await Promise.all([
        getBookings(),
        getRestaurants(),
      ]);

      // Extract restaurants array from the paginated response
      const restaurantsData = restaurantsResponse.restaurants || [];

      // Filter restaurants to only include those owned by this admin
      const adminRestaurants = restaurantsData.filter(
        (restaurant) => restaurant.userId === user?.id
      );

      // Filter bookings to only include those from the admin's restaurants
      const adminRestaurantIds = adminRestaurants.map(
        (restaurant) => restaurant.id
      );
      const adminBookings = bookingsData.filter(
        (booking) =>
          booking.restaurantId &&
          adminRestaurantIds.includes(booking.restaurantId)
      );

      setBookings(adminBookings);
      setFilteredBookings(adminBookings);
      setRestaurants(adminRestaurants);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings when filter criteria change
  const filterBookings = useCallback(() => {
    let filtered = [...bookings];

    // Filter by restaurant
    if (selectedRestaurant !== "all") {
      filtered = filtered.filter(
        (booking) => booking.restaurantId === selectedRestaurant
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status === selectedStatus
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, selectedRestaurant, selectedStatus]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    try {
      await updateBooking(id, { status });

      // Update booking in both bookings and filtered bookings
      const updatedBookings = bookings.map((b) =>
        b.id === id ? { ...b, status } : b
      );

      setBookings(updatedBookings);
      setSuccessMessage(`Booking status updated to ${status}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to update status");
    }
  };

  const openDeleteDialog = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    // Clear the booking to delete with a slight delay to avoid UI flicker
    setTimeout(() => {
      setBookingToDelete(null);
    }, 200);
  };

  const handleDeleteBooking = async () => {
    // Ensure we have a booking to delete
    if (!bookingToDelete) return;

    try {
      setDeleteLoading(true);

      // Call the API to delete the booking
      await deleteBooking(bookingToDelete.id);

      // Remove the deleted booking from state
      const updatedBookings = bookings.filter(
        (booking) => booking.id !== bookingToDelete.id
      );
      setBookings(updatedBookings);

      // Update filtered bookings too
      setFilteredBookings(
        filteredBookings.filter((booking) => booking.id !== bookingToDelete.id)
      );

      // Show success message
      setSuccessMessage("Booking deleted successfully");

      // Close the dialog
      closeDeleteDialog();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage || "Failed to delete booking. Please try again.");
      console.error("Error deleting booking:", err);

      // Close the dialog even on error
      closeDeleteDialog();
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Restaurant Bookings</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Home
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

      {!loading && restaurants.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center mb-6">
          <p className="text-gray-600 text-lg mb-4">
            You don't have any restaurants to manage.
          </p>
          <Link
            to="/restaurants/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create a Restaurant
          </Link>
        </div>
      )}

      {!loading && restaurants.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Filter Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedRestaurant.toString()}
                onChange={(e) =>
                  setSelectedRestaurant(
                    e.target.value === "all" ? "all" : parseInt(e.target.value)
                  )
                }
              >
                <option value="all">All My Restaurants</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedStatus.toString()}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as BookingStatus | "all")
                }
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
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
                  Restaurant
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
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.User?.username || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="text-blue-600 hover:text-blue-800"
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
                    {booking.Restaurant?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.RestaurantTable
                      ? `Table ${booking.RestaurantTable.tableNumber}`
                      : "N/A"}
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
                    <Link
                      to={`/bookings/${booking.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </Link>
                    {/* Status change buttons */}
                    <div className="flex space-x-1 mt-2">
                      {booking.status !== "confirmed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(booking.id, "confirmed")
                          }
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Confirm
                        </button>
                      )}
                      {booking.status !== "pending" && (
                        <button
                          onClick={() =>
                            handleStatusChange(booking.id, "pending")
                          }
                          className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                        >
                          Pending
                        </button>
                      )}
                      {booking.status !== "cancelled" && (
                        <button
                          onClick={() =>
                            handleStatusChange(booking.id, "cancelled")
                          }
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteDialog(booking)}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id.toString());
                          setIsChatOpen(true);
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 ml-1"
                      >
                        Chat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 text-lg">
            {restaurants.length > 0
              ? "No bookings found matching your filters."
              : "You don't have any bookings to manage."}
          </p>
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          <p>Total bookings: {bookings.length}</p>
          <p>Filtered bookings: {filteredBookings.length}</p>
        </div>
      )}

      {/* Delete confirmation dialog using shadcn Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white max-w-md mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 fixed">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the booking "
              {bookingToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </div>
              ) : (
                "Delete Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat component */}
      {isChatOpen && selectedBookingId && user && (
        <ChatBox
          bookingId={selectedBookingId}
          userId={user.id.toString()}
          username={user.fullName || user.username || user.email}
          role={user.role as "admin" | "user"}
          restaurantUserId={
            bookings
              .find((b) => b.id.toString() === selectedBookingId)
              ?.Restaurant?.userId.toString() || ""
          }
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminBookingsPage;
