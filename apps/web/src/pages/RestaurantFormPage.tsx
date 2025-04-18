import React, { useState, useEffect, useRef } from "react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          // If there's an existing image URL, set it as the preview
          if (data.imageUrl) {
            setImagePreview(data.imageUrl);
          }

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file type
      if (!file.type.match("image.*")) {
        setError("Please select an image file");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      setError(null);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({
      ...formData,
      imageUrl: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      // Create FormData object for multipart/form-data submission
      const formPayload = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Only add non-empty values and skip imageUrl since we're handling it separately
        if (value && key !== "imageUrl") {
          formPayload.append(key, value as string);
        }
      });

      // Add image file if selected
      if (imageFile) {
        formPayload.append("image", imageFile);
      }

      if (isEditing && restaurantId) {
        // Update existing restaurant
        await updateRestaurant(restaurantId, formPayload, true); // true indicates FormData
      } else {
        // Create new restaurant
        await createRestaurant(formPayload, true); // true indicates FormData
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
        <Link
          to={isEditing ? `/restaurants/${restaurantId}` : "/restaurants"}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to {isEditing ? "Restaurant Details" : "Restaurants"}
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
            <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                  htmlFor="image"
                  className="block text-gray-700 font-semibold mb-2"
                >
                  Restaurant Image
                </label>
                <div className="space-y-4">
                  {imagePreview && (
                    <div className="relative w-full h-48 overflow-hidden rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Restaurant preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-700"
                        title="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose an image for your restaurant (optional). Maximum
                    size: 5MB
                  </p>
                </div>
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
