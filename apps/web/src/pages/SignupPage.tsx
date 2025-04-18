import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../utils/auth";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../types/errors";
import {
  isStrongPassword,
  getPasswordStrengthFeedback,
  isValidEmail,
  isValidUsername,
  sanitizeInput,
} from "../utils/validations";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");

  // Validation states
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordStrengthFeedback, setPasswordStrengthFeedback] = useState<
    string[]
  >([]);
  const [passwordError, setPasswordError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Check password strength when it changes
  useEffect(() => {
    if (password && passwordTouched) {
      const feedback = getPasswordStrengthFeedback(password);
      setPasswordStrengthFeedback(feedback);
    }
  }, [password, passwordTouched]);

  const validateForm = (): boolean => {
    // Reset all errors
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setError("");

    let isValid = true;

    // Sanitize and validate username
    const cleanUsername = sanitizeInput(username);
    if (!isValidUsername(cleanUsername)) {
      setUsernameError(
        "Username must be 3-20 characters and can only contain letters, numbers, and underscore"
      );
      isValid = false;
    }

    // Validate email
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Validate password
    if (!isStrongPassword(password)) {
      setPasswordError(
        "Please ensure your password meets all the strength requirements"
      );
      isValid = false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
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

    setIsLoading(true);

    try {
      // Sanitize inputs before sending
      const cleanUsername = sanitizeInput(username);
      const cleanFullName = fullName ? sanitizeInput(fullName) : undefined;

      // Call the signup function from auth.ts
      await signup(cleanUsername, email, password, cleanFullName, role);

      // Update the auth context state
      login();

      // Redirect directly to homepage after successful signup
      navigate("/");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create an Account
        </h2>

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
              htmlFor="username"
              className="block text-gray-700 font-medium mb-2"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${usernameError ? "border-red-500" : ""}`}
              required
            />
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              3-20 characters, letters, numbers, and underscore only
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="fullName"
              className="block text-gray-700 font-medium mb-2"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

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

          <div className="mb-4">
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
              onFocus={() => setPasswordTouched(true)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${passwordError ? "border-red-500" : ""}`}
              required
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}

            {/* Password strength requirements */}
            {passwordTouched && (
              <div className="mt-2 text-sm">
                <p className="font-medium text-gray-700">
                  Password requirements:
                </p>
                <ul className="list-disc pl-5 mt-1">
                  {[
                    "At least 8 characters",
                    "One uppercase letter",
                    "One lowercase letter",
                    "One number",
                    "One special character",
                  ].map((req, index) => {
                    const isMet = passwordStrengthFeedback.every(
                      (feedback) => !feedback.includes(req.toLowerCase())
                    );
                    return (
                      <li
                        key={index}
                        className={isMet ? "text-green-600" : "text-gray-500"}
                      >
                        {req} {isMet && "✓"}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 font-medium mb-2"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="role"
              className="block text-gray-700 font-medium mb-2"
            >
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
