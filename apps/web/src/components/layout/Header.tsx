import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Header: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Auth state will be updated by the context
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          GroupleBooking
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Desktop & Mobile Navigation */}
        <nav
          className={`${menuOpen ? "block absolute top-16 left-0 right-0 bg-blue-600 shadow-md z-10 p-4" : "hidden"} md:block`}
        >
          <ul
            className={`${menuOpen ? "flex flex-col space-y-2" : "flex space-x-4"} md:flex md:space-x-4 md:space-y-0`}
          >
            <li>
              <Link
                to="/"
                className="hover:underline block py-1"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            {isLoggedIn ? (
              <>
                {/* Show My Bookings only for non-admin users */}
                {!isAdmin && (
                  <li>
                    <Link
                      to="/bookings"
                      className="hover:underline block py-1"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                  </li>
                )}

                {/* Show Restaurants with different label based on user role */}
                <li>
                  <Link
                    to="/restaurants"
                    className="hover:underline block py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    {isAdmin ? "My Restaurants" : "Restaurants"}
                  </Link>
                </li>

                {/* Admin specific navigation - could add more here */}
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin/bookings"
                      className="hover:underline block py-1"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Bookings
                    </Link>
                  </li>
                )}

                <li>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="hover:underline block py-1 w-full text-left"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </li>
                <li className={`${menuOpen ? "mt-2" : "ml-4"} md:ml-4`}>
                  <span className="px-2 py-1 bg-blue-700 rounded-full text-sm block md:inline-block">
                    {user?.username}
                    {isAdmin && " (Admin)"}
                  </span>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className="hover:underline block py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="hover:underline block py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
