import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../utils/auth";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call the API login function from auth.ts with admin flag
      await loginAdmin(email, password);

      // Update the auth context state
      login();

      // Redirect to admin dashboard or homepage after successful login
      navigate("/");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) ||
          "Admin login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Admin Login</h2>
        <p className="text-gray-600 text-center mb-6">
          Login with administrator credentials
        </p>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-2"
            >
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Admin Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Not an admin?{" "}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Go to user login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
