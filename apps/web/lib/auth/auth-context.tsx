'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthUser, AuthSession, AuthEvent, isGuestUser } from './types';
import { posthog } from 'posthog-js';

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthSession, event: AuthEvent): AuthSession {
  switch (event.type) {
    case 'SIGN_IN_STARTED':
      return { ...state, isLoading: true, error: null };
    case 'SIGN_IN_SUCCESS':
      return { ...state, user: event.user, isLoading: false, error: null };
    case 'SIGN_IN_ERROR':
      return { ...state, isLoading: false, error: event.error };
    case 'SIGN_OUT_STARTED':
      return { ...state, isLoading: true };
    case 'SIGN_OUT_SUCCESS':
      return { ...state, user: null, isLoading: false, error: null };
    case 'SIGN_OUT_ERROR':
      return { ...state, isLoading: false, error: event.error };
    case 'GUEST_CREATED':
      return { ...state, isLoading: false };
    case 'ACCOUNT_LINKED':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check active sessions and set the user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = await mapSupabaseUser(session.user);
          dispatch({ type: 'SIGN_IN_SUCCESS', user });
          
          // Track sign in event
          posthog.identify(user.id, {
            email: user.email,
            isGuest: user.isGuest,
            isParent: user.isParent,
          });
        } else {
          dispatch({ type: 'SIGN_OUT_SUCCESS' });
          posthog.reset();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  async function mapSupabaseUser(user: User): Promise<AuthUser> {
    const role = (user.app_metadata as any)?.role;

    return {
      id: user.id,
      email: user.email || undefined,
      isGuest: isGuestUser(user),
      isParent: role === 'parent',
      isVerified: Boolean(user.email_confirmed_at || user.phone_confirmed_at),
    };
  }

  async function signInWithEmail(email: string) {
    try {
      dispatch({ type: 'SIGN_IN_STARTED' });
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            is_parent: false,
          },
        },
      });

      if (error) throw error;

      // Track sign in attempt
      posthog.capture('cta_clicked', {
        type: 'sign_in',
        method: 'email',
      });

    } catch (error) {
      dispatch({ 
        type: 'SIGN_IN_ERROR', 
        error: error instanceof Error ? error : new Error('Failed to sign in') 
      });
      throw error;
    }
  }

  async function signOut() {
    try {
      dispatch({ type: 'SIGN_OUT_STARTED' });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch({ type: 'SIGN_OUT_SUCCESS' });
      router.push('/');
    } catch (error) {
      dispatch({ 
        type: 'SIGN_OUT_ERROR', 
        error: error instanceof Error ? error : new Error('Failed to sign out') 
      });
      throw error;
    }
  }

  const value = {
    ...state,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
