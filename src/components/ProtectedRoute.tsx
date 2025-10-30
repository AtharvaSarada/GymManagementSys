import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Checking access', {
    user: !!user,
    userProfile,
    loading,
    allowedRoles,
    currentPath: location.pathname
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, we need to wait for profile to load
  if (allowedRoles && requireAuth && user && !userProfile) {
    console.log('ProtectedRoute: User exists but profile not loaded, waiting...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If specific roles are required, check if user has the right role
  if (allowedRoles && userProfile) {
    console.log('ProtectedRoute: Checking role access');
    console.log('ProtectedRoute: User role:', userProfile.role);
    console.log('ProtectedRoute: Allowed roles:', allowedRoles);
    console.log('ProtectedRoute: Access granted:', allowedRoles.includes(userProfile.role));
    
    if (!allowedRoles.includes(userProfile.role)) {
      console.log('ProtectedRoute: Access denied, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
};

// Convenience components for specific roles
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>
);

export const MemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN', 'MEMBER']}>{children}</ProtectedRoute>
);

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN', 'MEMBER', 'USER']}>{children}</ProtectedRoute>
);