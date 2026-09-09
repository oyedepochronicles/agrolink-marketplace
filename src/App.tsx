import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VerifiedRoute } from "@/components/VerifiedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { SplashScreen } from "@capacitor/splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AnnouncementDetails from "./pages/AnnouncementDetails.tsx";
import Announcements from "./pages/Announcements.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import Affiliate from "./pages/auth/Affiliate";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
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
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import AcceptAdminInvite from "./pages/auth/AcceptAdminInvite";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminSecurityEvents from "./pages/admin/AdminSecurityEvents";
import AdminTeam from "./pages/admin/AdminTeam";
import Unauthorized from "./pages/Unauthorized";
import { getLocation, takePhoto } from "./lib/permissions.ts";
import AdminAnalytics from "./pages/dashboard/AdminAnalytics";
import AdminAnnouncements from "./pages/dashboard/AdminAnnouncements";
import AdminConfig from "./pages/dashboard/AdminConfig";
import AdminOrders from "./pages/dashboard/AdminOrders";
import AdminOverview from "./pages/dashboard/AdminOverview";
import AdminPayouts from "./pages/dashboard/AdminPayouts";
import AdminProducts from "./pages/dashboard/AdminProducts";
import AdminSupport from "./pages/dashboard/AdminSupport";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminVerifications from "./pages/dashboard/AdminVerifications";
import FarmerBatches from "./pages/dashboard/FarmerBatches";
import FarmerOrders from "./pages/dashboard/FarmerOrders";
import FarmerOverview from "./pages/dashboard/FarmerOverview";
import FarmerPickupCenter from "./pages/dashboard/FarmerPickupCenter";
import FarmerProducts from "./pages/dashboard/FarmerProducts";
import FarmerSLA from "./pages/dashboard/FarmerSLA";
import RiderBatches from "./pages/dashboard/RiderBatches";
import RiderDeliveries from "./pages/dashboard/RiderDeliveries";
import Wallet from "./pages/dashboard/Wallet";
import ParentOrderDetails from "./pages/marketplace/ParentOrderDetails";
import Messages from "./pages/Messages";

const isNativeApp = Capacitor.isNativePlatform();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const App = () => {
  useEffect(() => {
    if (!isNativeApp) return;

    const listener = CapacitorApp.addListener("appUrlOpen", (event) => {
      console.log(event.url);
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  getLocation();
  takePhoto();
  return (
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
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/accept-admin-invite" element={<AcceptAdminInvite />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/404" element={<NotFound />} />
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
                  path="orders/:id"
                  element={
                    <ProtectedRoute>
                      <ParentOrderDetails />
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
              <Route
                path="/announcements"
                element={
                  <ProtectedRoute
                    roles={["buyer", "farmer", "rider", "admin", "super_admin"]}
                  >
                    <VerifiedRoute>
                      <Announcements />
                    </VerifiedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/announcements/:id"
                element={
                  <ProtectedRoute
                    roles={["buyer", "farmer", "rider", "admin", "super_admin"]}
                  >
                    <VerifiedRoute>
                      <AnnouncementDetails />
                    </VerifiedRoute>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["farmer", "rider"]}>
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
                <Route
                  path="farmer/batches"
                  element={
                    <ProtectedRoute roles={["farmer"]}>
                      <FarmerBatches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="farmer/pickup"
                  element={
                    <ProtectedRoute roles={["farmer"]}>
                      <FarmerPickupCenter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="farmer/sla"
                  element={
                    <ProtectedRoute roles={["farmer"]}>
                      <FarmerSLA />
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
                  path="rider/batches"
                  element={
                    <ProtectedRoute roles={["rider"]}>
                      <RiderBatches />
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

                {/* Legacy admin paths — the admin console now lives at /admin */}
                <Route path="admin/*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* Isolated admin console */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="payouts" element={<AdminPayouts />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="security-events" element={<AdminSecurityEvents />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route
                  path="team"
                  element={
                    <AdminRoute superAdminOnly>
                      <AdminTeam />
                    </AdminRoute>
                  }
                />
                <Route
                  path="config"
                  element={
                    <AdminRoute superAdminOnly>
                      <AdminConfig />
                    </AdminRoute>
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
};

export default App;
