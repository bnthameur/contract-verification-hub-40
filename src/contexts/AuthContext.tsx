
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthResponse } from '@supabase/supabase-js';
import { supabase, ensureUserProfile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create or update user profile
  const setupProfile = async (userId: string, email: string) => {
    if (!userId || !email) return null;
    
    try {
      console.log('Setting up profile for user:', userId, email);
      const profile = await ensureUserProfile(userId, email);
      console.log('Profile setup complete:', profile);
      
      if (!profile) {
        toast({
          title: 'Profile Error',
          description: 'Failed to create or update your user profile. Please try signing out and back in.',
          variant: 'destructive',
        });
      }
      
      return profile;
    } catch (error) {
      console.error('Failed to setup profile:', error);
      toast({
        title: 'Profile Error',
        description: 'Failed to create or update your user profile. Please try signing out and back in.',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // If we have a user, ensure their profile exists
        if (session?.user && session.user.email) {
          try {
            await setupProfile(session.user.id, session.user.email);
          } catch (error) {
            console.error('Error setting up profile during init:', error);
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        // Always set loading to false when done, regardless of success or error
        setLoading(false);
      }
    };

    // Initialize auth
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // If we have a user, ensure their profile exists
        if (session?.user && session.user.email) {
          try {
            await setupProfile(session.user.id, session.user.email);
          } catch (error) {
            console.error('Error in auth state change:', error);
          }
        }
        
        // Always update loading state when auth state changes
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await supabase.auth.signInWithPassword({ email, password });
      
      if (response.error) {
        console.error('Sign in error:', response.error);
        toast({
          title: "Authentication Error",
          description: response.error.message,
          variant: "destructive",
        });
        return response;
      }
      
      if (response.data.user && response.data.session) {
        try {
          await setupProfile(response.data.user.id, email);
        } catch (error) {
          console.error('Error during profile setup after sign in:', error);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during sign in",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            email: email,
          }
        }
      });
      
      if (response.error) {
        console.error('Sign up error:', response.error);
        toast({
          title: "Registration Error",
          description: response.error.message,
          variant: "destructive",
        });
        return response;
      }
      
      if (response.data.user) {
        try {
          // This will create the profile immediately rather than waiting for confirmation
          await setupProfile(response.data.user.id, email);
        } catch (error) {
          console.error('Failed to create profile after signup:', error);
        }
        
        if (!response.data.session) {
          toast({
            title: "Verification Required",
            description: "Please check your email to verify your account before signing in.",
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred during registration",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out properly",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
