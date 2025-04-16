import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to GroupleBooking System
        </h1>

        {isLoggedIn && user ? (
          <div className="mb-6">
            <p className="text-xl">Hello, {user.username}!</p>
            <p className="text-gray-600 mt-2">
              You're logged in. View your bookings or create a new one.
            </p>
            <div className="mt-4">
              <Link
                to="/bookings"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-4"
              >
                View My Bookings
              </Link>
              <Link
                to="/bookings/new"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Make New Booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-xl">Your group booking solution!</p>
            <p className="text-gray-600 mt-2">
              Please log in to manage your bookings or create a new account.
            </p>
            <div className="mt-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-4"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-3">Group Booking Made Easy</h2>
          <p className="text-gray-600">
            Organize events, reserve spaces, and coordinate with your group all
            in one place.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-3">Real-time Updates</h2>
          <p className="text-gray-600">
            Get instant notifications about booking status changes and group
            activity.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-3">Secure & Reliable</h2>
          <p className="text-gray-600">
            Your booking data is encrypted and securely stored in our system.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
