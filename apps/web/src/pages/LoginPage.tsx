import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../utils/auth";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";
import { isValidEmail } from "../utils/validations";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    // Reset all errors
    setEmailError("");
    setError("");

    let isValid = true;

    // Validate email
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Simple validation for empty password
    if (!password.trim()) {
      setError("Password cannot be empty");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form before submission
    if (!validateForm()) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Sanitize email before sending
      const sanitizedEmail = email.trim().toLowerCase();

      // Call the API login function from auth.ts
      await loginApi(sanitizedEmail, password);

      // Update the auth context state
      login();

      // Redirect to homepage after successful login
      navigate("/");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">User Login</h2>
        <p className="text-gray-600 text-center mb-6">Login to your account</p>

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
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${emailError ? "border-red-500" : ""}`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-gray-600 mt-2">
            Admin?{" "}
            <Link to="/admin/login" className="text-blue-600 hover:underline">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
