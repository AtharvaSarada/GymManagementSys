import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useRoleBasedNavigation = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If authenticated but no profile, wait for profile to load
    if (!userProfile) return;

    // If on root path, redirect based on role
    if (location.pathname === '/') {
      switch (userProfile.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'MEMBER':
          navigate('/member');
          break;
        case 'USER':
          navigate('/user');
          break;
        default:
          navigate('/unauthorized');
      }
    }
  }, [user, userProfile, loading, navigate, location.pathname]);

  return { user, userProfile, loading };
};