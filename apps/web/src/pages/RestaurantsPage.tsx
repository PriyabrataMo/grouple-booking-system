import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  getRestaurants,
  Restaurant,
  deleteRestaurant,
  RestaurantParams,
  RestaurantPaginatedResponse,
} from "../utils/restaurantApi";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const RestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sortBy") || "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") || "asc") as "asc" | "desc"
  );

  // Dynamically calculate items per page based on total count
  const [itemsPerPage, setItemsPerPage] = useState<number>(4); // Default to 4

  // Load restaurants on component mount
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Check for success message from redirects
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }

    fetchRestaurants();
  }, [isLoggedIn, navigate, location, currentPage, sortBy, sortOrder]);

  // Update URL when pagination or sorting changes
  useEffect(() => {
    const params: { [key: string]: string } = {
      page: currentPage.toString(),
      sortBy,
      sortOrder,
    };
    setSearchParams(params);
  }, [currentPage, sortBy, sortOrder, setSearchParams]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      // Set a fixed number of items per page (4)
      const fixedItemsPerPage = 4;
      setItemsPerPage(fixedItemsPerPage);

      // Get restaurants with pagination
      const params: RestaurantParams = {
        page: currentPage,
        limit: fixedItemsPerPage,
        sortBy,
        sortOrder,
      };

      const data: RestaurantPaginatedResponse = await getRestaurants(params);
      const totalItems = data.totalCount;

      // Calculate total pages based on the fixed items per page
      const calculatedTotalPages = Math.ceil(totalItems / fixedItemsPerPage);

      // Reset to page 1 if current page is now invalid
      if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setCurrentPage(1);

        // Update URL immediately to prevent loading invalid page
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", "1");
        setSearchParams(newParams);

        // Don't continue with the current fetch, it will be triggered again by state change
        setLoading(false);
        return;
      }

      // If user is a regular user, show all restaurants
      // Otherwise (for admins), filter to only show their own restaurants
      let filteredRestaurants;
      if (user?.role === "user") {
        filteredRestaurants = data.restaurants; // Show all restaurants for regular users
      } else {
        // For admin users - show only their own restaurants
        filteredRestaurants = data.restaurants.filter(
          (restaurant) => restaurant.userId === user?.id
        );
      }

      setRestaurants(filteredRestaurants);
      setTotalCount(totalItems);
      setTotalPages(calculatedTotalPages);

      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load restaurants");
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (id: number) => {
    // Prevent multiple rapid clicks
    if (deleteLoading) return;

    const confirmMessage =
      "Are you sure you want to delete this restaurant? This will also delete all associated tables and bookings. This action cannot be undone.";

    if (window.confirm(confirmMessage)) {
      try {
        setDeleteLoading(true);
        setDeleteId(id);

        // Call the API to delete the restaurant
        await deleteRestaurant(id);

        // Remove the deleted restaurant from state
        setRestaurants((prevRestaurants) =>
          prevRestaurants.filter((restaurant) => restaurant.id !== id)
        );

        // Show success message
        setSuccessMessage("Restaurant deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setError(
          errorMessage ||
            "Failed to delete restaurant. It might have related bookings or tables."
        );
        console.error("Error deleting restaurant:", err);
      } finally {
        setDeleteLoading(false);
        setDeleteId(null);
      }
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Sorting handlers
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setCurrentPage(1); // Reset to first page when sort order changes
  };

  // Format time for display
  const formatTime = (timeString: string) => {
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          {user?.role === "user" ? "All Restaurants" : "My Restaurants"}
        </h1>
        <div className="flex flex-col sm:flex-row gap-4">
          {user?.role !== "user" && (
            <Link
              to="/restaurants/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add New Restaurant
            </Link>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="sortBy" className="text-gray-700">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              className="border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="name">Name</option>
              <option value="cuisine">Cuisine</option>
              <option value="createdAt">Date Added</option>
            </select>
            <button
              onClick={handleSortOrderToggle}
              className="bg-gray-200 hover:bg-gray-300 rounded-md p-2"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? <span>↑</span> : <span>↓</span>}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
          <button
            className="float-right font-bold"
            onClick={() => setSuccessMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-xl text-gray-600">
            {totalCount === 0
              ? "No restaurants found."
              : "No restaurants on this page."}
          </p>
          <p className="mt-2 text-gray-500">
            {user?.role !== "user"
              ? "Add a new restaurant to get started."
              : "Try adjusting your filters or go to another page."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 flex flex-col md:flex-row"
            >
              <div className="md:w-1/3 relative">
                {restaurant.imageUrl ? (
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="w-full h-64 md:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xl">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-6 md:w-2/3 flex flex-col">
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {restaurant.name}
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {restaurant.cuisine}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <span className="font-semibold">Address:</span>{" "}
                    {restaurant.address}
                  </p>
                  {restaurant.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}
                  <div className="flex items-center mb-4">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-gray-600">
                      <span className="font-semibold">Hours:</span>{" "}
                      {formatTime(restaurant.openingTime)} -{" "}
                      {formatTime(restaurant.closingTime)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/restaurants/${restaurant.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      ></path>
                    </svg>
                    View Details
                  </Link>
                  {user?.role === "user" ? (
                    <Link
                      to={`/restaurants/${restaurant.id}/book`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      Make Reservation
                    </Link>
                  ) : (
                    <>
                      <Link
                        to={`/restaurants/${restaurant.id}/edit`}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 inline-flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          ></path>
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className={`bg-red-600 text-white px-4 py-2 rounded-md inline-flex items-center ${deleteLoading && deleteId === restaurant.id ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"}`}
                        disabled={deleteLoading}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                        {deleteLoading && deleteId === restaurant.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <div>
            <p className="text-gray-600">
              Showing{" "}
              {restaurants.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}{" "}
              - {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
              {totalCount} restaurants
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded-md ${
                currentPage <= 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              // Calculate page numbers to show (centered around current page)
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = idx + 1;
              } else if (currentPage <= 3) {
                pageToShow = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + idx;
              } else {
                pageToShow = currentPage - 2 + idx;
              }

              // Only show if the calculated page is valid
              if (pageToShow > 0 && pageToShow <= totalPages) {
                return (
                  <button
                    key={pageToShow}
                    onClick={() => setCurrentPage(pageToShow)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === pageToShow
                        ? "bg-blue-700 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {pageToShow}
                  </button>
                );
              }
              return null;
            })}
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-md ${
                currentPage >= totalPages
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;
