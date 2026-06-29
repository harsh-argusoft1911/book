import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Dashboard Imports
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import BookTest from "./pages/dashboard/BookTest";
import MyCart from "./pages/dashboard/MyCart";
import MyReports from "./pages/dashboard/MyReports";
import HealthInsights from "./pages/dashboard/HealthInsights";
import SavedProfiles from "./pages/dashboard/SavedProfiles";
import HealthVault from "./pages/dashboard/HealthVault";
import Rewards from "./pages/dashboard/Rewards";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/dashboard/Profile";
import Auth from "./pages/Auth";

// Pathology Side Imports
import PathologyLayout from "./components/pathology/PathologyLayout";
import PathologyDashboard from "./pages/pathology/PathologyDashboard";
import PathologyBookings from "./pages/pathology/PathologyBookings";
import PathologyWalkin from "./pages/pathology/PathologyWalkin";
import PathologyManage from "./pages/pathology/PathologyManage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          
          {/* Patient Dashboard Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/patient/:patientId" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="book" element={<BookTest />} />
              <Route path="cart" element={<MyCart />} />
              <Route path="reports" element={<MyReports />} />
              <Route path="insights" element={<HealthInsights />} />
              <Route path="profiles" element={<SavedProfiles />} />
              <Route path="vault" element={<HealthVault />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Pathology Side Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pathology/:labId" element={<PathologyLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PathologyDashboard />} />
              <Route path="bookings" element={<PathologyBookings />} />
              <Route path="walkin" element={<PathologyWalkin />} />
              <Route path="manage" element={<PathologyManage />} />
              <Route path="staff" element={<div className="p-8">Lab Staff Management (Coming Soon)</div>} />
              <Route path="earnings" element={<div className="p-8">Earnings Detailed Analysis (Coming Soon)</div>} />
              <Route path="inventory" element={<div className="p-8">Inventory Management (Coming Soon)</div>} />
              <Route path="settings" element={<div className="p-8">Pathology Settings (Coming Soon)</div>} />
            </Route>
          </Route>

          {/* Admin Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
