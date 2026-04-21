import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import ProtectedRoute from "./components/layout/ProtectedRoute/ProtectedRoute";

// Auth Pages
import Login from "./pages/Auth/Login/Login";
import Register from "./pages/Auth/Register/Register";

// Admin Pages
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import UserList from "./pages/Admin/UserManagement/UserList/UserList";
import CreateUser from "./pages/Admin/UserManagement/CreateUser/CreateUser";
import CustomerList from "./pages/Admin/CustomerManagement/CustomerList/CustomerList";
import AddCustomer from "./pages/Admin/CustomerManagement/AddCustomer/AddCustomer";
import RoleList from "./pages/Admin/RoleManagement/RoleList/RoleList";
import CreateRole from "./pages/Admin/RoleManagement/CreateRole/CreateRole";
import BeauticianList from "./pages/Admin/BeauticianManagement/BeauticianList/BeauticianList";
import AddBeautician from "./pages/Admin/BeauticianManagement/AddBeautician/AddBeautician";
import BeauticianVerification from "./pages/Admin/BeauticianManagement/BeauticianVerification/BeauticianVerification";
import ServiceCategories from "./pages/Admin/ContentManagement/ServiceCategories/ServiceCategories";
import SubCategories from "./pages/Admin/ContentManagement/SubCategories/SubCategories";
import PricingConfig from "./pages/Admin/ContentManagement/PricingConfig/PricingConfig";
import PromotionalBanners from "./pages/Admin/ContentManagement/PromotionalBanners/PromotionalBanners";
import AllBookings from "./pages/Admin/BookingManagement/AllBookings/AllBookings";
import ComplaintsList from "./pages/Admin/Reports/ComplaintsList/ComplaintsList";
import RevenueReport from "./pages/Admin/Reports/RevenueReport/RevenueReport";
import ReviewManagement from "./pages/Admin/ReviewManagement/ReviewManagement";
import CosmeticManagement from "./pages/Admin/CosmeticManagement/CosmeticManagement";
import PayoutManagement from "./pages/Admin/PayoutManagement/PayoutManagement";
import AdminNotifications from "./pages/Admin/AdminNotifications/AdminNotifications";
import CuratedServices from "./pages/Admin/ContentManagement/CuratedServices/CuratedServices";

// Customer Pages
import CustomerDashboard from "./pages/Customer/CustomerDashboard/CustomerDashboard";
import BrowseServices from "./pages/Customer/BrowseServices/BrowseServices";
import BookService from "./pages/Customer/BookService/BookService";
import MyBookings from "./pages/Customer/MyBookings/MyBookings";
import Profile from "./pages/Customer/Profile/Profile";

// Beautician Pages
import BeauticianDashboard from "./pages/Beautician/BeauticianDashboard/BeauticianDashboard";
import MySchedule from "./pages/Beautician/MySchedule/MySchedule";
import ServiceRequests from "./pages/Beautician/ServiceRequests/ServiceRequests";
import Earnings from "./pages/Beautician/Earnings/Earnings";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route path="/dashboard" element={<ProtectedRoute permission="Dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute permission="User Management"><UserList /></ProtectedRoute>} />
            <Route path="/admin/users/create" element={<ProtectedRoute permission="User Management"><CreateUser /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute permission="Customer Management"><CustomerList /></ProtectedRoute>} />
            <Route path="/admin/customers/add" element={<ProtectedRoute permission="Customer Management"><AddCustomer /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute permission="Role"><RoleList /></ProtectedRoute>} />
            <Route path="/admin/roles/create" element={<ProtectedRoute permission="Role"><CreateRole /></ProtectedRoute>} />
            <Route path="/admin/beauticians" element={<ProtectedRoute permission="Beauticians"><BeauticianList /></ProtectedRoute>} />
            <Route path="/admin/beauticians/add" element={<ProtectedRoute permission="Beauticians"><AddBeautician /></ProtectedRoute>} />
            <Route path="/admin/beautician-verification" element={<ProtectedRoute permission="Beautician Verify"><BeauticianVerification /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute permission="Categories"><ServiceCategories /></ProtectedRoute>} />
            <Route path="/admin/sub-categories" element={<ProtectedRoute permission="Categories"><SubCategories /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute permission="Services"><PricingConfig /></ProtectedRoute>} />
            <Route path="/admin/banners" element={<ProtectedRoute permission="Banners"><PromotionalBanners /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute permission="Bookings"><AllBookings /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute permission="Complaints"><ComplaintsList /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute permission="Reports"><RevenueReport /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute permission="Reviews"><ReviewManagement /></ProtectedRoute>} />
            <Route path="/admin/cosmetics" element={<ProtectedRoute permission="Cosmetics"><CosmeticManagement /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute permission="Payouts"><PayoutManagement /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute permission="Notifications"><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/curated-services" element={<ProtectedRoute permission="Curated Services"><CuratedServices /></ProtectedRoute>} />

            {/* Customer Routes */}
            <Route path="/customer/dashboard" element={<ProtectedRoute roles={["Customer"]}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/services" element={<ProtectedRoute roles={["Customer"]}><BrowseServices /></ProtectedRoute>} />
            <Route path="/customer/book" element={<ProtectedRoute roles={["Customer"]}><BookService /></ProtectedRoute>} />
            <Route path="/customer/bookings" element={<ProtectedRoute roles={["Customer"]}><MyBookings /></ProtectedRoute>} />
            <Route path="/customer/profile" element={<ProtectedRoute roles={["Customer"]}><Profile /></ProtectedRoute>} />

            {/* Beautician Routes */}
            <Route path="/beautician/dashboard" element={<ProtectedRoute roles={["Beautician"]}><BeauticianDashboard /></ProtectedRoute>} />
            <Route path="/beautician/schedule" element={<ProtectedRoute roles={["Beautician"]}><MySchedule /></ProtectedRoute>} />
            <Route path="/beautician/requests" element={<ProtectedRoute roles={["Beautician"]}><ServiceRequests /></ProtectedRoute>} />
            <Route path="/beautician/earnings" element={<ProtectedRoute roles={["Beautician"]}><Earnings /></ProtectedRoute>} />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
