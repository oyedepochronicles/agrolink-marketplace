import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Affiliate from "./pages/auth/Affiliate";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import { MarketplaceLayout } from "@/components/marketplace/MarketplaceLayout";
import MarketplaceHome from "./pages/marketplace/MarketplaceHome";
import MarketplaceSearch from "./pages/marketplace/MarketplaceSearch";
import ProductDetails from "./pages/marketplace/ProductDetails";
import Cart from "./pages/marketplace/Cart";
import Profile from "./pages/marketplace/Profile";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import FarmerOverview from "./pages/dashboard/FarmerOverview";
import FarmerProducts from "./pages/dashboard/FarmerProducts";
import FarmerOrders from "./pages/dashboard/FarmerOrders";
import RiderDeliveries from "./pages/dashboard/RiderDeliveries";
import AdminOverview from "./pages/dashboard/AdminOverview";
import AdminVerifications from "./pages/dashboard/AdminVerifications";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminProducts from "./pages/dashboard/AdminProducts";
import ComingSoonWallet from "./pages/dashboard/ComingSoonWallet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Public auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Marketplace */}
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<MarketplaceHome />} />
              <Route path="search" element={<MarketplaceSearch />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["farmer", "rider", "admin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/" replace />} />
              {/* Farmer */}
              <Route path="farmer" element={<ProtectedRoute roles={["farmer"]}><FarmerOverview /></ProtectedRoute>} />
              <Route path="farmer/products" element={<ProtectedRoute roles={["farmer"]}><FarmerProducts /></ProtectedRoute>} />
              <Route path="farmer/orders" element={<ProtectedRoute roles={["farmer"]}><FarmerOrders /></ProtectedRoute>} />
              <Route path="farmer/wallet" element={<ProtectedRoute roles={["farmer"]}><ComingSoonWallet /></ProtectedRoute>} />

              {/* Rider */}
              <Route path="rider" element={<ProtectedRoute roles={["rider"]}><RiderDeliveries /></ProtectedRoute>} />
              <Route path="rider/earnings" element={<ProtectedRoute roles={["rider"]}><ComingSoonWallet /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="admin" element={<ProtectedRoute roles={["admin"]}><AdminOverview /></ProtectedRoute>} />
              <Route path="admin/verifications" element={<ProtectedRoute roles={["admin"]}><AdminVerifications /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="admin/products" element={<ProtectedRoute roles={["admin"]}><AdminProducts /></ProtectedRoute>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
