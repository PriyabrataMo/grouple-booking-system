import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createBooking, BookingCreateInput } from "../utils/bookingApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const BookingCreatePage: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      setLoading(true);

      // Prepare booking data
      const bookingData: BookingCreateInput = {
        title,
        description: description || undefined,
        startTime: startTimeValue.toISOString(),
        endTime: endTimeValue.toISOString(),
      };

      await createBooking(bookingData);
      navigate("/bookings");
    } catch (error: unknown) {
      setError(
        getErrorMessage(error) || "Error creating booking. Please try again."
      );
      console.error("Error creating booking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get current date and time for default values
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const currentDate = `${year}-${month}-${day}`;
    const currentTime = `${hours}:${minutes}`;

    // Set default start time to now
    setStartDate(currentDate);
    setStartTime(currentTime);

    // Set default end time to 1 hour from now
    const laterTime = new Date(now.getTime() + 60 * 60 * 1000);
    const laterHours = String(laterTime.getHours()).padStart(2, "0");
    const laterMinutes = String(laterTime.getMinutes()).padStart(2, "0");
    setEndDate(currentDate);
    setEndTime(`${laterHours}:${laterMinutes}`);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/bookings" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Bookings
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold">Create New Booking</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded">
            {error}
          </div>
        )}

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

            <div className="flex justify-end space-x-4">
              <Link
                to="/bookings"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingCreatePage;
