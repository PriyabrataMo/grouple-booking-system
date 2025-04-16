import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getBookingById,
  updateBooking,
  BookingUpdateInput,
  Booking,
} from "../utils/bookingApi";
import { BookingStatus } from "../types/booking";
import { getErrorMessage } from "../types/errors";
import { useAuth } from "../hooks/useAuth";

const BookingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Fetch booking data and redirect if not logged in
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

        // Set form values
        setTitle(data.title || "");
        setDescription(data.description || "");
        setStatus(data.status);

        // Format dates and times
        const startDateTime = new Date(data.startTime);
        const endDateTime = new Date(data.endTime);

        if (!isNaN(startDateTime.getTime())) {
          setStartDate(startDateTime.toISOString().split("T")[0]);
          setStartTime(startDateTime.toTimeString().slice(0, 5));
        }

        if (!isNaN(endDateTime.getTime())) {
          setEndDate(endDateTime.toISOString().split("T")[0]);
          setEndTime(endDateTime.toTimeString().slice(0, 5));
        }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id) return;

    // Validate inputs
    if (!title) {
      setError("Title is required");
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setError("Start and end dates/times are required");
      return;
    }

    try {
      // Format dates for API
      const startTimeValue = new Date(`${startDate}T${startTime}`);
      const endTimeValue = new Date(`${endDate}T${endTime}`);

      if (isNaN(startTimeValue.getTime()) || isNaN(endTimeValue.getTime())) {
        setError("Invalid date/time format");
        return;
      }

      if (startTimeValue >= endTimeValue) {
        setError("End time must be after start time");
        return;
      }

      setSaving(true);

      // Prepare booking data
      const bookingData: BookingUpdateInput = {
        title,
        description: description || undefined,
        startTime: startTimeValue.toISOString(),
        endTime: endTimeValue.toISOString(),
        status,
      };

      await updateBooking(parseInt(id), bookingData);
      navigate(`/bookings/${id}`);
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) || "Error updating booking. Please try again."
      );
      console.error("Error updating booking:", err);
    } finally {
      setSaving(false);
    }
  };

  // Get status badge class based on booking status
  const getStatusBadgeClass = (statusValue: string) => {
    switch (statusValue) {
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
          to={`/bookings/${id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Booking Details
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold">Edit Booking</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : booking ? (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="status"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="statusPending"
                      name="status"
                      value="pending"
                      checked={status === "pending"}
                      onChange={() => setStatus("pending")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="statusPending"
                      className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass("pending")}`}
                    >
                      Pending
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="statusConfirmed"
                      name="status"
                      value="confirmed"
                      checked={status === "confirmed"}
                      onChange={() => setStatus("confirmed")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="statusConfirmed"
                      className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass("confirmed")}`}
                    >
                      Confirmed
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="statusCancelled"
                      name="status"
                      value="cancelled"
                      checked={status === "cancelled"}
                      onChange={() => setStatus("cancelled")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="statusCancelled"
                      className={`rounded-full px-2 py-0.5 text-xs ${getStatusBadgeClass("cancelled")}`}
                    >
                      Cancelled
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to={`/bookings/${id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 text-center rounded-lg">
            <p className="text-xl text-gray-600">Booking not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingEditPage;
