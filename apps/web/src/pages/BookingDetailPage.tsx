import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getBookingById, deleteBooking, Booking } from "../utils/bookingApi";
import { useAuth } from "../context/AuthContext";

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
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
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load booking details"
        );
        console.error("Error fetching booking details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id, isLoggedIn, navigate]);

  const handleDelete = async () => {
    if (!booking || !id) return;

    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await deleteBooking(parseInt(id));
        navigate("/bookings");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete booking");
      }
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
        <Link to="/bookings" className="text-blue-600 hover:text-blue-800">
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
            <Link
              to={`/bookings/${booking.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
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
    </div>
  );
};

export default BookingDetailPage;
