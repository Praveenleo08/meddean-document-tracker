import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UploadPage from "./pages/UploadPage";
import AllCommunicationsPage from "./pages/AllCommunicationsPage";
import PendingWorksPage from "./pages/PendingWorksPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DepartmentDashboardPage from "./pages/DepartmentDashboardPage";

// Protected Layout Route wrapper
function ProtectedLayout({ children, requiredRole }) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return user.role === "admin" ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/department/dashboard" replace />
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-layout">
        <Sidebar />
        <main className="main-viewport">{children}</main>
      </div>
    </div>
  );
}

// Root redirector
function RootRedirect() {
  const { user, token } = useAuth();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return user.role === "admin" ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/department/dashboard" replace />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedLayout requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <ProtectedLayout requiredRole="admin">
                <UploadPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/communications"
            element={
              <ProtectedLayout requiredRole="admin">
                <AllCommunicationsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/pending"
            element={
              <ProtectedLayout requiredRole="admin">
                <PendingWorksPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedLayout requiredRole="admin">
                <DepartmentsPage />
              </ProtectedLayout>
            }
          />

          {/* Department Routes */}
          <Route
            path="/department/dashboard"
            element={
              <ProtectedLayout requiredRole="department">
                <DepartmentDashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/department/pending"
            element={
              <ProtectedLayout requiredRole="department">
                <PendingWorksPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/department/communications"
            element={
              <ProtectedLayout requiredRole="department">
                <DepartmentDashboardPage />
              </ProtectedLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  </AuthProvider>
);
}
