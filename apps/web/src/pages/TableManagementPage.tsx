import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getRestaurantById,
  getRestaurantTables,
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
  Restaurant,
  RestaurantTable,
  TableCreateInput,
  TableUpdateInput,
} from "../utils/restaurantApi";
import { getErrorMessage } from "../types/errors";

const TableManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const restaurantId = id ? parseInt(id) : 0;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  // Form state for new/edit table
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentTableId, setCurrentTableId] = useState<number | null>(null);
  const [tableFormData, setTableFormData] = useState<
    TableCreateInput & TableUpdateInput
  >({
    tableNumber: 1,
    capacity: 4,
    isAvailable: true,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // Only admins can manage tables
    if (!isAdmin) {
      navigate("/restaurants");
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

        // Verify admin owns this restaurant
        if (restaurantData.userId !== user?.id) {
          navigate("/restaurants");
          return;
        }

        setRestaurant(restaurantData);
        setTables(tablesData);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err) || "Failed to load restaurant data");
        console.error("Error loading restaurant data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, isLoggedIn, user, navigate, isAdmin]);

  // Rest of component remains the same
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setTableFormData({
      ...tableFormData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "tableNumber" || name === "capacity"
            ? parseInt(value)
            : value,
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentTableId(null);
    setTableFormData({
      tableNumber: getNextTableNumber(),
      capacity: 4,
      isAvailable: true,
    });
  };

  const getNextTableNumber = () => {
    if (!tables.length) return 1;
    return Math.max(...tables.map((table) => table.tableNumber)) + 1;
  };

  const handleEditTable = (table: RestaurantTable) => {
    setIsEditing(true);
    setCurrentTableId(table.id);
    setTableFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      isAvailable: table.isAvailable,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!restaurantId) return;

    try {
      setError(null);

      // Check if table number already exists (excluding current table if editing)
      const tableNumberExists = tables.some(
        (t) =>
          t.tableNumber === tableFormData.tableNumber &&
          (!isEditing || (isEditing && t.id !== currentTableId))
      );

      if (tableNumberExists) {
        setError(`Table number ${tableFormData.tableNumber} already exists`);
        return;
      }

      if (isEditing && currentTableId) {
        // Update existing table
        await updateRestaurantTable(
          restaurantId,
          currentTableId,
          tableFormData
        );

        // Update tables state
        setTables((prevTables) =>
          prevTables.map((table) =>
            table.id === currentTableId ? { ...table, ...tableFormData } : table
          )
        );

        setSuccessMessage("Table updated successfully");
      } else {
        // Create new table
        const newTable = await createRestaurantTable(
          restaurantId,
          tableFormData
        );

        // Add new table to state
        setTables((prevTables) => [...prevTables, newTable]);
        setSuccessMessage("Table created successfully");
      }

      // Reset form
      resetForm();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        getErrorMessage(err) ||
          `Failed to ${isEditing ? "update" : "create"} table`
      );
      console.error(`Error ${isEditing ? "updating" : "creating"} table:`, err);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!restaurantId) return;

    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await deleteRestaurantTable(restaurantId, tableId);

        // Remove table from state
        setTables((prevTables) =>
          prevTables.filter((table) => table.id !== tableId)
        );

        setSuccessMessage("Table deleted successfully");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setError(getErrorMessage(err) || "Failed to delete table");
        console.error("Error deleting table:", err);
      }
    }
  };

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

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">
            Manage Tables
            {restaurant && ` for ${restaurant.name}`}
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
        ) : (
          <>
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-6 rounded">
                {successMessage}
              </div>
            )}

            <div className="p-6">
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditing ? "Edit Table" : "Add New Table"}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label
                        htmlFor="tableNumber"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Table Number*
                      </label>
                      <input
                        type="number"
                        id="tableNumber"
                        name="tableNumber"
                        min="1"
                        value={tableFormData.tableNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="capacity"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Capacity*
                      </label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        min="1"
                        max="20"
                        value={tableFormData.capacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <div className="mt-6">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="isAvailable"
                            checked={tableFormData.isAvailable}
                            onChange={handleInputChange}
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Available</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {isEditing ? "Update Table" : "Add Table"}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <h2 className="text-xl font-semibold mb-4">Tables</h2>
              {tables.length === 0 ? (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <p className="text-lg text-gray-600">
                    No tables added yet. Add a table to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tables
                        .sort((a, b) => a.tableNumber - b.tableNumber)
                        .map((table) => (
                          <tr key={table.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {table.tableNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {table.capacity} people
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  table.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {table.isAvailable
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditTable(table)}
                                className="text-yellow-600 hover:text-yellow-800 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTable(table.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TableManagementPage;
