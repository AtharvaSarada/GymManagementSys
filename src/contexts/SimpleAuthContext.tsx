import React, { createContext, useContext, useEffect, useState } from 'react';

// Type imports
type User = any;
type Session = any;
type AppUser = any;
type UserRole = 'ADMIN' | 'MEMBER' | 'USER';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const SimpleAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user] = useState<User | null>({ id: 'test-user', email: 'test@example.com' });
  const [userProfile] = useState<AppUser | null>({
    id: 'test-user',
    role: 'USER' as UserRole,
    full_name: 'Test User',
    email: 'test@example.com'
  });
  const [session] = useState<Session | null>({ user: { id: 'test-user', email: 'test@example.com' } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleAuthProvider: Starting initialization');
    
    // Simple timeout to simulate loading
    const timer = setTimeout(() => {
      console.log('SimpleAuthProvider: Initialization complete');
      setLoading(false);
    }, 1000);

    return () => {
      console.log('SimpleAuthProvider: Cleaning up');
      clearTimeout(timer);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('SimpleAuthProvider: Sign in called', email, password);
    // Mock sign in
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    console.log('SimpleAuthProvider: Sign up called', email, password, fullName, role);
    // Mock sign up
  };

  const signOut = async () => {
    console.log('SimpleAuthProvider: Sign out called');
    // Mock sign out
  };

  const resetPassword = async (email: string) => {
    console.log('SimpleAuthProvider: Reset password called', email);
    // Mock reset password
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};