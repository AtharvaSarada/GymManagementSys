import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Type imports
type User = any; // Supabase User type
type Session = any; // Supabase Session type
type AppUser = any; // Our app user type
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Starting initialization');
    
    // Load user profile from database
    const loadUserProfile = async (currentUser: any) => {
      try {
        console.log('AuthProvider: Loading user profile from database for:', currentUser.id);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error || !data) {
          console.log('AuthProvider: User not found in database, error:', error);
          console.log('AuthProvider: Creating fallback profile with USER role');
          // Create fallback profile - this should only happen for new users
          const fallbackProfile = {
            id: currentUser.id,
            role: 'USER' as UserRole,
            full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
            email: currentUser?.email || ''
          };
          console.log('AuthProvider: Fallback profile created:', fallbackProfile);
          setUserProfile(fallbackProfile);
        } else {
          console.log('AuthProvider: User profile loaded from database:', data);
          console.log('AuthProvider: User role from database:', data.role);
          setUserProfile(data);
        }
      } catch (error) {
        console.error('AuthProvider: Error loading user profile:', error);
        // Create fallback profile
        const fallbackProfile = {
          id: currentUser.id,
          role: 'USER' as UserRole,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
          email: currentUser?.email || ''
        };
        setUserProfile(fallbackProfile);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthProvider: Timeout reached, stopping loading');
      setLoading(false);
    }, 5000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthProvider: Initial session result:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Loading profile for user:', session.user.id);
          await loadUserProfile(session.user);
        } else {
          console.log('AuthProvider: No user session found');
        }
        
        setLoading(false);
        console.log('AuthProvider: Initialization complete');
      } catch (error) {
        console.error('AuthProvider: Unexpected error:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Auth change - Loading profile for user:', session.user.id);
          loadUserProfile(session.user);
        } else {
          console.log('AuthProvider: Auth change - No user, clearing profile');
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up');
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    console.log('AuthProvider: Starting signup process for:', email, 'with role:', role);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) {
      console.error('AuthProvider: Signup error:', error);
      throw error;
    }

    console.log('AuthProvider: Signup successful, user created:', data.user?.id);

    // Create user profile in database
    if (data.user) {
      try {
        console.log('AuthProvider: Creating user profile in database...');
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role
          });

        if (profileError) {
          console.error('AuthProvider: Error creating user profile:', profileError);
          // Don't throw error here, user is already created in auth
        } else {
          console.log('AuthProvider: User profile created successfully');
        }

        // If role is MEMBER, also create member record
        if (role === 'MEMBER') {
          console.log('AuthProvider: Creating member record for user:', data.user.id);
          
          // Add a small delay to ensure user record is created first
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const memberData = {
            user_id: data.user.id,
            join_date: new Date().toISOString().split('T')[0],
            status: 'INACTIVE'
          };
          
          console.log('AuthProvider: Inserting member data:', memberData);
          
          const { data: memberResult, error: memberError } = await supabase
            .from('members')
            .insert(memberData)
            .select();

          if (memberError) {
            console.error('AuthProvider: Error creating member record:', memberError);
            console.error('AuthProvider: Member error details:', {
              message: memberError.message,
              details: memberError.details,
              hint: memberError.hint,
              code: memberError.code
            });
          } else {
            console.log('AuthProvider: Member record created successfully:', memberResult);
          }
        }
      } catch (profileError) {
        console.error('AuthProvider: Unexpected error creating profile:', profileError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
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