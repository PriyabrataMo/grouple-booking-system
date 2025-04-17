import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getBookingById, deleteBooking, Booking } from "../utils/bookingApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";
import { Loader, MessageSquare } from "lucide-react";
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

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const fetchBookingData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getBookingById(parseInt(id));
        setBooking(data);
        setError(null);
      } catch (err: unknown) {
        setError(getErrorMessage(err) || "Failed to load booking details");
        console.error("Error fetching booking details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id, isLoggedIn, navigate]);

  const openDeleteDialog = () => {
    if (!booking) return;
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!booking || !id) return;

    try {
      setDeleteLoading(true);
      await deleteBooking(parseInt(id));
      navigate("/bookings");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to delete booking");
      closeDeleteDialog();
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
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
          to={user?.role === "admin" ? "/admin/bookings" : "/bookings"}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Bookings
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
      ) : booking ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{booking.title}</h1>
              <span
                className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(booking.status)}`}
              >
                {booking.status.charAt(0).toUpperCase() +
                  booking.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">
                {booking.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Start Time</h2>
                <p className="text-gray-700">{formatDate(booking.startTime)}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">End Time</h2>
                <p className="text-gray-700">{formatDate(booking.endTime)}</p>
              </div>
            </div>

            {booking.guestCount && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Number of Guests</h2>
                <p className="text-gray-700">{booking.guestCount}</p>
              </div>
            )}

            {booking.Restaurant && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Restaurant</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-800">
                    {booking.Restaurant.name}
                  </p>
                  <p className="text-gray-700">{booking.Restaurant.address}</p>
                  {booking.Restaurant.phone && (
                    <p className="text-gray-600">{booking.Restaurant.phone}</p>
                  )}
                </div>
              </div>
            )}

            {booking.RestaurantTable && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  Table Information
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-medium">Table Number:</span>{" "}
                    {booking.RestaurantTable.tableNumber}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Capacity:</span>{" "}
                    {booking.RestaurantTable.capacity} people
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Created</h2>
              <p className="text-gray-700">{formatDate(booking.createdAt)}</p>
            </div>

            {booking.User && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Booked By</h2>
                <p className="text-gray-700">
                  {booking.User.username} ({booking.User.email})
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-4">
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <MessageSquare className="mr-2" size={18} />
              {user?.role === "admin"
                ? "Chat with Guest"
                : "Chat with Restaurant"}
            </button>
            <Link
              to={`/bookings/${booking.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
            <button
              onClick={openDeleteDialog}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">Booking not found.</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white max-w-md mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 fixed">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking
              {booking?.title ? ` "${booking.title}"` : ""}? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
      {isChatOpen && booking && user && (
        <ChatBox
          bookingId={booking.id.toString()}
          userId={user.id.toString()}
          username={user.fullName || user.username || user.email}
          role={user.role as "admin" | "user"}
          restaurantUserId={booking.Restaurant?.userId.toString() || ""}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default BookingDetailPage;
