import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VerifiedRoute } from "@/components/VerifiedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Announcements from "./pages/Announcements.tsx";

import Affiliate from "./pages/auth/Affiliate";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import VerifyPending from "./pages/auth/VerifyPending";

import { MarketplaceLayout } from "@/components/marketplace/MarketplaceLayout";
import Cart from "./pages/marketplace/Cart";
import Checkout from "./pages/marketplace/Checkout";
import MarketplaceHome from "./pages/marketplace/MarketplaceHome";
import MarketplaceSearch from "./pages/marketplace/MarketplaceSearch";
import Orders from "./pages/marketplace/Orders";
import ProductDetails from "./pages/marketplace/ProductDetails";
import Profile from "./pages/marketplace/Profile";
import Support from "./pages/marketplace/Support";
import SupportTicket from "./pages/marketplace/SupportTicket";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import AdminAnalytics from "./pages/dashboard/AdminAnalytics";
import AdminOrders from "./pages/dashboard/AdminOrders";
import AdminOverview from "./pages/dashboard/AdminOverview";
import AdminPayouts from "./pages/dashboard/AdminPayouts";
import AdminProducts from "./pages/dashboard/AdminProducts";
import AdminSupport from "./pages/dashboard/AdminSupport";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminVerifications from "./pages/dashboard/AdminVerifications";
import FarmerOrders from "./pages/dashboard/FarmerOrders";
import FarmerOverview from "./pages/dashboard/FarmerOverview";
import FarmerProducts from "./pages/dashboard/FarmerProducts";
import FarmerBatches from "./pages/dashboard/FarmerBatches";
import FarmerPickupCenter from "./pages/dashboard/FarmerPickupCenter";
import FarmerSLA from "./pages/dashboard/FarmerSLA";
import RiderDeliveries from "./pages/dashboard/RiderDeliveries";
import RiderBatches from "./pages/dashboard/RiderBatches";
import AdminConfig from "./pages/dashboard/AdminConfig";
import AdminAnnouncements from "./pages/dashboard/AdminAnnouncements";
import ParentOrderDetails from "./pages/marketplace/ParentOrderDetails";
import Wallet from "./pages/dashboard/Wallet";
import Messages from "./pages/Messages";

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
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/verify-pending"
              element={
                <ProtectedRoute>
                  <VerifyPending />
                </ProtectedRoute>
              }
            />

            {/* Marketplace */}
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<MarketplaceHome />} />
              <Route path="search" element={<MarketplaceSearch />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route
                path="orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="messages"
                element={
                  <ProtectedRoute>
                    <Messages variant="marketplace" />
                  </ProtectedRoute>
                }
              />
              <Route path="support" element={<Support />} />
              <Route
                path="support/:id"
                element={
                  <ProtectedRoute>
                    <SupportTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Navigate to="/marketplace/orders" replace />
                </ProtectedRoute>
              }
            />

            {/* Global announcements feed (primary broadcast channel) */}
            <Route path="/announcements" element={<Announcements />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  roles={["farmer", "rider", "admin", "super_admin"]}
                >
                  <VerifiedRoute>
                    <DashboardLayout />
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/" replace />} />
              {/* Farmer */}
              <Route
                path="farmer"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <FarmerOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="farmer/products"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <FarmerProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="farmer/orders"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <FarmerOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="farmer/messages"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="farmer/wallet"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <Wallet />
                  </ProtectedRoute>
                }
              />

              {/* Rider */}
              <Route
                path="rider"
                element={
                  <ProtectedRoute roles={["rider"]}>
                    <RiderDeliveries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rider/messages"
                element={
                  <ProtectedRoute roles={["rider"]}>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rider/earnings"
                element={
                  <ProtectedRoute roles={["rider"]}>
                    <Wallet />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/verifications"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminVerifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/orders"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/products"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/payouts"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminPayouts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/analytics"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/messages"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/support"
                element={
                  <ProtectedRoute roles={["admin", "super_admin"]}>
                    <AdminSupport />
                  </ProtectedRoute>
                }
              />
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
