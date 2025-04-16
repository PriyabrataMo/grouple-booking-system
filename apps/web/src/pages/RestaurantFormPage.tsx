import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  RestaurantCreateInput,
  RestaurantUpdateInput,
} from "../utils/restaurantApi";
import { getErrorMessage } from "../types/errors";

const RestaurantFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const restaurantId = id ? parseInt(id) : 0;

  const [loading, setLoading] = useState<boolean>(isEditing);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  // Form state
  const [formData, setFormData] = useState<
    RestaurantCreateInput & RestaurantUpdateInput
  >({
    name: "",
    address: "",
    cuisine: "",
    description: "",
    openingTime: "09:00",
    closingTime: "22:00",
    imageUrl: "",
  });

  useEffect(() => {
    // Check if user is logged in and has appropriate role
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Only admin can access this page
    if (!isAdmin) {
      navigate("/restaurants");
      return;
    }

    // If editing, fetch restaurant data
    if (isEditing && restaurantId) {
      const fetchRestaurant = async () => {
        try {
          setLoading(true);
          const data = await getRestaurantById(restaurantId);
          // Check if admin is owner of this restaurant
          if (data.userId !== user?.id) {
            navigate("/restaurants");
            return;
          }

          // Populate form data
          setFormData({
            name: data.name,
            address: data.address,
            cuisine: data.cuisine,
            description: data.description || "",
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            imageUrl: data.imageUrl || "",
          });

          setError(null);
        } catch (err) {
          setError(getErrorMessage(err) || "Failed to load restaurant");
          console.error("Error loading restaurant:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchRestaurant();
    }
  }, [isEditing, restaurantId, isLoggedIn, user, navigate, isAdmin]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && restaurantId) {
        // Update existing restaurant
        await updateRestaurant(restaurantId, formData);
      } else {
        // Create new restaurant
        await createRestaurant(formData);
      }

      // Redirect to restaurants page
      navigate("/restaurants", {
        state: {
          message: isEditing
            ? "Restaurant updated successfully!"
            : "Restaurant created successfully!",
        },
      });
    } catch (err) {
      setError(
        getErrorMessage(err) ||
          `Failed to ${isEditing ? "update" : "create"} restaurant`
      );
      console.error(
        `Error ${isEditing ? "updating" : "creating"} restaurant:`,
        err
      );
      setSubmitting(false);
    }
  };

  // List of cuisines for dropdown
  const cuisines = [
    "American",
    "Italian",
    "Chinese",
    "Japanese",
    "Mexican",
    "Mediterranean",
    "Indian",
    "Thai",
    "French",
    "Greek",
    "Spanish",
    "Korean",
    "Vietnamese",
    "Middle Eastern",
    "Caribbean",
    "Fusion",
    "Other",
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/restaurants" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Restaurants
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Restaurant" : "Add New Restaurant"}
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-6 mt-6 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Restaurant Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="address"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Address*
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="cuisine"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Cuisine Type*
                </label>
                <select
                  id="cuisine"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a cuisine</option>
                  {cuisines.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="openingTime"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Opening Time*
                  </label>
                  <input
                    type="time"
                    id="openingTime"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="closingTime"
                    className="block text-gray-700 font-semibold mb-2"
                  >
                    Closing Time*
                  </label>
                  <input
                    type="time"
                    id="closingTime"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="imageUrl"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter a URL for the restaurant image (optional)
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {submitting
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Restaurant"
                      : "Create Restaurant"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantFormPage;
