import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BookingsPage from "./pages/BookingsPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import BookingCreatePage from "./pages/BookingCreatePage";
import BookingEditPage from "./pages/BookingEditPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import RestaurantFormPage from "./pages/RestaurantFormPage";
import RestaurantBookingPage from "./pages/RestaurantBookingPage";
import TableManagementPage from "./pages/TableManagementPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Booking Routes */}
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/new" element={<BookingCreatePage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/bookings/:id/edit" element={<BookingEditPage />} />

              {/* Restaurant Routes */}
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/restaurants/new" element={<RestaurantFormPage />} />
              <Route
                path="/restaurants/:id"
                element={<RestaurantDetailPage />}
              />
              <Route
                path="/restaurants/:id/edit"
                element={<RestaurantFormPage />}
              />
              <Route
                path="/restaurants/:id/book"
                element={<RestaurantBookingPage />}
              />
              <Route
                path="/restaurants/:id/tables/manage"
                element={<TableManagementPage />}
              />

              {/* Admin Routes */}
              <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
