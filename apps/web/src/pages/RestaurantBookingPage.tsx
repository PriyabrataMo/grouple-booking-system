import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getRestaurantById,
  Restaurant,
  getRestaurantTables,
  RestaurantTable,
} from "../utils/restaurantApi";
import { createBooking } from "../utils/bookingApi";
import { RestaurantBookingInput } from "../utils/restaurantApi";
import { getErrorMessage } from "../types/errors";

const RestaurantBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const restaurantId = id ? parseInt(id) : 0;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [bookingData, setBookingData] = useState<{
    tableId: number | "";
    guestCount: number;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    description: string;
  }>({
    tableId: "",
    guestCount: 1,
    date: "",
    startTime: "",
    endTime: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        const [restaurantData, tablesData] = await Promise.all([
          getRestaurantById(restaurantId),
          getRestaurantTables(restaurantId),
        ]);

        setRestaurant(restaurantData);
        // Filter available tables
        setTables(tablesData.filter((table) => table.isAvailable));

        setError(null);
      } catch (err) {
        setError(getErrorMessage(err) || "Failed to load restaurant data");
        console.error("Error loading restaurant data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, isLoggedIn, navigate]);

  // Set default booking title when restaurant is loaded
  useEffect(() => {
    if (restaurant) {
      setBookingData((prev) => ({
        ...prev,
        title: `Reservation at ${restaurant.name}`,
      }));
    }
  }, [restaurant]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setBookingData((prev) => {
      const newData = {
        ...prev,
        [name]:
          name === "tableId" || name === "guestCount"
            ? value === ""
              ? ""
              : parseInt(value)
            : value,
      };

      // Validate times if both are present
      if (newData.startTime && newData.endTime && newData.date) {
        try {
          const startDateTime = new Date(
            `${newData.date}T${newData.startTime}`
          );
          const endDateTime = new Date(`${newData.date}T${newData.endTime}`);

          if (
            !isNaN(startDateTime.getTime()) &&
            !isNaN(endDateTime.getTime())
          ) {
            if (endDateTime <= startDateTime) {
              setTimeError("End time must be after start time");
            } else {
              setTimeError(null);
            }
          }
        } catch (err) {
          console.error("Error parsing dates:", err);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !restaurant) return;

    // Reset error state
    setError(null);
    setTimeError(null);

    // Validate inputs
    const { date, startTime, endTime, guestCount } = bookingData;
    if (!date || !startTime || !endTime || guestCount < 1) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate times
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError("Invalid date or time format");
        return;
      }

      if (endDateTime <= startDateTime) {
        setError("End time must be after start time");
        setTimeError("End time must be after start time");
        return;
      }
    } catch (err) {
      setError("Invalid date or time format");
      console.error("Error parsing dates:", err);
      return;
    }

    try {
      setSubmitting(true);

      // Create booking input
      const bookingInput: RestaurantBookingInput = {
        restaurantId: restaurantId,
        tableId: bookingData.tableId === "" ? undefined : bookingData.tableId,
        title: bookingData.title || `Reservation at ${restaurant.name}`,
        description: bookingData.description,
        startTime: new Date(`${date}T${startTime}`).toISOString(),
        endTime: new Date(`${date}T${endTime}`).toISOString(),
        guestCount: bookingData.guestCount,
      };

      // Submit booking
      await createBooking({
        ...bookingInput,
        userId: user.id,
      });

      // Redirect to bookings page on success
      navigate("/bookings", {
        state: { message: "Reservation created successfully!" },
      });
    } catch (err) {
      setSubmitting(false);
      setError(getErrorMessage(err) || "Failed to create reservation");
      console.error("Error creating reservation:", err);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  // Get available time slots based on restaurant hours
  const getAvailableTimeSlots = () => {
    if (!restaurant) return [];

    const timeSlots = [];
    const [openingHours, openingMinutes] = restaurant.openingTime
      .split(":")
      .map(Number);
    const [closingHours, closingMinutes] = restaurant.closingTime
      .split(":")
      .map(Number);

    for (let h = openingHours; h <= closingHours; h++) {
      for (const m of [0, 30]) {
        if (h === closingHours && m > closingMinutes) continue;
        if (h === openingHours && m < openingMinutes) continue;

        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        timeSlots.push(`${hour}:${minute}`);
      }
    }

    return timeSlots;
  };

  const timeSlots = getAvailableTimeSlots();

  // Get min and max guest counts
  const getMinMaxGuests = () => {
    if (!tables || tables.length === 0) return { min: 1, max: 10 };

    const minCapacity = 1;
    const maxCapacity = Math.max(...tables.map((table) => table.capacity));

    return { min: minCapacity, max: maxCapacity };
  };

  const { min: minGuests, max: maxGuests } = getMinMaxGuests();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        {restaurant && (
          <Link
            to={`/restaurants/${restaurantId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Back to {restaurant.name}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">
            Make a Reservation
            {restaurant && ` at ${restaurant.name}`}
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-6 rounded">
            {error}
          </div>
        ) : restaurant ? (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="date"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Date*
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  min={today}
                  value={bookingData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Start Time*
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    value={bookingData.startTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      timeError
                        ? "border-red-500 ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    required
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time, index) => (
                      <option key={`start-${index}`} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    End Time*
                  </label>
                  <select
                    id="endTime"
                    name="endTime"
                    value={bookingData.endTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      timeError
                        ? "border-red-500 ring-red-500"
                        : "focus:ring-blue-500"
                    }`}
                    required
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time, index) => (
                      <option key={`end-${index}`} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {timeError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {timeError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="guestCount"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Number of Guests*
                  </label>
                  <input
                    type="number"
                    id="guestCount"
                    name="guestCount"
                    min={minGuests}
                    max={maxGuests}
                    value={bookingData.guestCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="tableId"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Table (Optional)
                  </label>
                  <select
                    id="tableId"
                    name="tableId"
                    value={bookingData.tableId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a table</option>
                    {tables.map((table) => (
                      <option
                        key={table.id}
                        value={table.id}
                        disabled={bookingData.guestCount > table.capacity}
                      >
                        Table {table.tableNumber} (Capacity: {table.capacity})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    If left blank, we'll assign the best available table for
                    your party size
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="title"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Reservation Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={bookingData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Special Requests/Notes (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={bookingData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !!timeError}
                  className={`px-6 py-3 rounded-md ${
                    submitting || timeError
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {submitting
                    ? "Creating Reservation..."
                    : "Complete Reservation"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-center text-gray-600">Restaurant not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantBookingPage;
