
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login, Register, ForgotPassword } from './components/auth';
import { AdminDashboard, MemberDashboard, UserDashboard, Unauthorized } from './pages';
import { ProtectedRoute } from './components/ProtectedRoute';



// Login wrapper that handles forgot password modal
const LoginPage: React.FC = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (showForgotPassword) {
    return <ForgotPassword />;
  }

  return <Login onForgotPassword={() => setShowForgotPassword(true)} />;
};



// Home component that redirects authenticated users based on role
const Home: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  console.log('Home component: user=', !!user, 'userProfile=', userProfile, 'loading=', loading);

  React.useEffect(() => {
    console.log('Home useEffect: user=', !!user, 'userProfile=', userProfile, 'loading=', loading);
    
    if (loading) {
      console.log('Home: Still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('Home: No user, redirecting to login');
      navigate('/login');
      return;
    }

    // Wait for user profile to load
    if (!userProfile) {
      console.log('Home: User found but profile not loaded yet, waiting...');
      return;
    }

    // Redirect based on user role
    console.log('Home: User found with role:', userProfile.role);
    switch (userProfile.role) {
      case 'ADMIN':
        console.log('Home: Redirecting to admin dashboard');
        navigate('/admin');
        break;
      case 'MEMBER':
        console.log('Home: Redirecting to member dashboard');
        navigate('/member');
        break;
      case 'USER':
      default:
        console.log('Home: Redirecting to user dashboard');
        navigate('/user');
        break;
    }
  }, [user, userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Home route with redirect logic */}
          <Route path="/" element={<Home />} />
          
          {/* Dashboard routes - strict role-based access */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/member" 
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user" 
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
