import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBookings, deleteBooking, Booking } from "../utils/bookingApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";
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

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Fetch bookings function, memoized to avoid unnecessary re-creations
  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      // Only show bookings created by the current user
      setBookings(data.filter((b) => b.userId === user?.id));
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching bookings:", err);
      // Check if the error is an axios error with response data
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        // Use the server's error message if available
        setError(
          axiosError.response?.data?.message || "Failed to load bookings"
        );
      } else {
        setError(getErrorMessage(err) || "Failed to load bookings");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load bookings on component mount
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    fetchBookings();
  }, [isLoggedIn, navigate, fetchBookings]);

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

  const handleDeleteBookingConfirmed = async () => {
    // Ensure we have a booking to delete
    if (!bookingToDelete) return;

    try {
      setDeleteLoading(true);

      // Call the API to delete the booking
      await deleteBooking(bookingToDelete.id);

      // Remove the deleted booking from state
      setBookings(
        bookings.filter((booking) => booking.id !== bookingToDelete.id)
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

  // Format date for display
  const formatDate = (dateString: string | Date) => {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link
          to="/restaurants"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Booking
        </Link>
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
      ) : bookings.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">
            You don't have any bookings yet.
          </p>
          <p className="mt-2 text-gray-500">
            Create a new booking to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
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
                    {booking.Restaurant?.name || "N/A"}
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
                      to={`/bookings/${booking.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </Link>
                    <Link
                      to={`/bookings/${booking.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => openDeleteDialog(booking)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    {booking.id && (
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.id.toString());
                          setIsChatOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 ml-3"
                      >
                        Chat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
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
              onClick={handleDeleteBookingConfirmed}
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

export default BookingsPage;
