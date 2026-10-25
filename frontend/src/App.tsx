import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { setTokenProvider } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Main Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { DocumentDetailPage } from '@/pages/DocumentDetailPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { ChatPage } from '@/pages/ChatPage';
import { SummariesPage } from '@/pages/SummariesPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HelpPage } from '@/pages/HelpPage';

// Root redirect helper
const RootRedirect: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return null;
  if (currentUser || userProfile) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

// Component to connect auth token retrieval to API client
const ApiTokenConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getIdToken } = useAuth();

  useEffect(() => {
    setTokenProvider(getIdToken);
  }, [getIdToken]);

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ApiTokenConnector>
        <Routes>
          {/* Public / Auth routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes wrapped in AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/summaries" element={<SummariesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ApiTokenConnector>
    </AuthProvider>
  );
};

export default App;
