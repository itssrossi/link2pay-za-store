
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, keepSignedIn?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    // Clear any corrupted session data on startup
    const clearCorruptedSession = () => {
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-mpzqlidtvlbijloeusuj-auth-token');
        console.log('Cleared potentially corrupted session data');
      } catch (error) {
        console.error('Error clearing session data:', error);
      }
    };

    // Set up auth state listener FIRST - synchronous to avoid deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Handle specific auth events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
        }
      }
    );

    // THEN get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          
          // If token refresh failed, clear corrupted session and set signed out state
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('Clearing corrupted session due to token error');
            clearCorruptedSession();
            
            if (mounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
            }
            return;
          }
        }

        console.log('Initial session:', session?.user?.id);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        
        // On any error, clear session and set signed out state
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add timeout to prevent infinite loading
    initTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000);

    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, keepSignedIn: boolean = true) => {
    try {
      console.log('Attempting to sign in user:', email);
      setLoading(true);
      
      // Set session persistence based on keepSignedIn option
      if (!keepSignedIn) {
        // Use session storage (browser session only) when not keeping signed in
        await supabase.auth.setSession(null as any);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      // If user doesn't want to stay signed in, we'll need to modify the session
      // Supabase doesn't directly support session-only storage after sign in,
      // but we can store this preference for handling on browser close
      if (!keepSignedIn && data.session) {
        // Store the preference in sessionStorage to handle on page/browser close
        sessionStorage.setItem('supabase_session_temporary', 'true');
        localStorage.removeItem('supabase_session_temporary');
      } else {
        // Remove temporary session flag if keeping signed in
        sessionStorage.removeItem('supabase_session_temporary');
        localStorage.removeItem('supabase_session_temporary');
      }

      console.log('Sign in successful:', data.user?.id);
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      console.log('Attempting to sign up user:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          emailRedirectTo: options?.emailRedirectTo || `${window.location.origin}/auth?confirmed=true`,
          data: {
            business_name: options?.data?.business_name || 'My Business',
            full_name: options?.data?.full_name || '',
            ...options?.data
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      console.log('Sign up successful:', data.user?.id);
      
      // Check if user needs email confirmation
      if (data.user && !data.session) {
        console.log('User created, email confirmation required');
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      console.log('Attempting to resend confirmation email:', email);
      setLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        return { error };
      }

      console.log('Confirmation email resent successfully');
      return { error: null };
    } catch (error) {
      console.error('Unexpected resend confirmation error:', error);
      return { error };
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
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
