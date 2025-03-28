
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
    if (!userId || !email) return;
    
    try {
      console.log('Setting up profile for user:', userId, email);
      const profile = await ensureUserProfile(userId, email);
      console.log('Profile setup complete:', profile);
      return profile;
    } catch (error) {
      console.error('Failed to setup profile:', error);
      toast({
        title: 'Profile Error',
        description: 'Failed to create or update your user profile. Please try signing out and back in.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a user, ensure their profile exists
      if (session?.user && session.user.email) {
        setupProfile(session.user.id, session.user.email)
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

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
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    
    if (response.data.user && response.data.session) {
      try {
        await setupProfile(response.data.user.id, email);
      } catch (error) {
        console.error('Error during profile setup after sign in:', error);
      }
    }
    
    return response;
  };

  const signUp = async (email: string, password: string) => {
    const response = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          email: email,
        }
      }
    });
    
    if (response.data.user) {
      try {
        await setupProfile(response.data.user.id, email);
      } catch (error) {
        console.error('Failed to create profile after signup:', error);
      }
    }
    
    return response;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
