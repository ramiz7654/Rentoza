import { Navigate, Route, Routes } from 'react-router-dom';
import Nav from './components/Nav';
import ProtectedRoute from './components/ProtectedRoute';
import ReviewPrompt from './components/ReviewPrompt';
import AuthPage from './pages/auth/AuthPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import Home from './pages/customer/Home';
import CategoryPage from './pages/customer/CategoryPage';
import VehicleDetail from './pages/customer/VehicleDetail';
import MyBookings from './pages/customer/MyBookings';
import BookingDetail from './pages/customer/BookingDetail';
import Profile from './pages/customer/Profile';
import Support from './pages/customer/Support';
import OwnerDashboard from './pages/owner/Dashboard';
import RentalProfile from './pages/owner/RentalProfile';
import OwnerVehicles from './pages/owner/Vehicles';
import OwnerAddVehicle from './pages/owner/AddVehicle';
import OwnerBookings from './pages/owner/Bookings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRentals from './pages/admin/Rentals';
import AdminVehicles from './pages/admin/Vehicles';
import AdminUsers from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminReviews from './pages/admin/Reviews';
import AdminSupport from './pages/admin/Support';
import AdminAccount from './pages/admin/Account';

const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Nav />
      <ReviewPrompt />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/home" element={guard(['customer'], <Home />)} />
        <Route path="/category/:category" element={guard(['customer'], <CategoryPage />)} />
        <Route path="/vehicles/:id" element={guard(['customer'], <VehicleDetail />)} />
        <Route path="/bookings" element={guard(['customer'], <MyBookings />)} />
        <Route path="/bookings/:id" element={guard(['customer'], <BookingDetail />)} />
        <Route path="/profile" element={guard(['customer'], <Profile />)} />
        <Route path="/support" element={guard(['customer'], <Support />)} />

        <Route path="/owner" element={guard(['owner'], <OwnerDashboard />)} />
        <Route path="/owner/rental" element={guard(['owner'], <RentalProfile />)} />
        <Route path="/owner/vehicles/add" element={guard(['owner'], <OwnerAddVehicle />)} />
        <Route path="/owner/vehicles" element={guard(['owner'], <OwnerVehicles />)} />
        <Route path="/owner/bookings" element={guard(['owner'], <OwnerBookings />)} />

        <Route path="/admin" element={guard(['admin'], <AdminDashboard />)} />
        <Route path="/admin/rentals" element={guard(['admin'], <AdminRentals />)} />
        <Route path="/admin/vehicles" element={guard(['admin'], <AdminVehicles />)} />
        <Route path="/admin/users" element={guard(['admin'], <AdminUsers />)} />
        <Route path="/admin/bookings" element={guard(['admin'], <AdminBookings />)} />
        <Route path="/admin/reviews" element={guard(['admin'], <AdminReviews />)} />
        <Route path="/admin/support" element={guard(['admin'], <AdminSupport />)} />
        <Route path="/admin/account" element={guard(['admin'], <AdminAccount />)} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
