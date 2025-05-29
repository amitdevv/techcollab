import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import HomePage from "./pages/Home";
import ProfilePage from "./pages/profile/Profile";
import DashboardPage from "./pages/dashboard/Dashboard";
import MarketplacePage from "./pages/marketplace/Marketplace.tsx";
import GigFormPage from "./pages/marketplace/GigForm";
import GigDetailsPage from "./pages/marketplace/GigDetails";
import EventsPage from "./pages/events/Events";
import EventFormPage from "./pages/events/EventForm";
import EventDetailsPage from "./pages/events/EventDetails";
import CommunityPage from "./pages/community/Community";
import MainLayout from "./components/layout/MainLayout";
import InboxPage from "./pages/inbox/Inbox";
import ChatConversationPage from "./pages/inbox/ChatConversation";
import SettingsPage from "./pages/settings/Settings";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import SavedItemsPage from "./pages/saved/SavedItems";
import NotificationsPage from "./pages/notifications/Notifications";
import JoinChannelPage from "./pages/JoinChannel";
import { ThemeProvider } from "./context/ThemeContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-[#232323] text-gray-900 dark:text-dark-text">
        <GoogleOAuthProvider clientId="613537072885-kil4a4gapu07nhod74emc3d6f111mgel.apps.googleusercontent.com">
          <AuthProvider>
            <NotificationProvider>
              <Toaster position="top-right" />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth/github/callback" element={<HomePage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/join/channel/:joinLink" element={<JoinChannelPage />} />
                
                {/* Protected routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:username" element={<ProfilePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/marketplace/create" element={<GigFormPage />} />
                  <Route path="/marketplace/:id" element={<GigDetailsPage />} />
                  <Route path="/marketplace/:id/edit" element={<GigFormPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/create" element={<EventFormPage />} />
                  <Route path="/events/:id" element={<EventDetailsPage />} />
                  <Route path="/events/edit/:id" element={<EventFormPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/inbox/:chatId" element={<ChatConversationPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/saved" element={<SavedItemsPage />} />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
