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
  createGuest: () => Promise<string>;
  linkGuestToUser: (email: string) => Promise<void>;
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || undefined,
      isGuest: isGuestUser(user),
      isParent: profile?.role === 'parent',
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

  async function createGuest() {
    try {
      dispatch({ type: 'SIGN_IN_STARTED' });
      
      const guestEmail = `guest_${Math.random().toString(36).substring(2, 15)}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: Math.random().toString(36).substring(2, 15) + 'A1!',
        options: {
          data: {
            is_guest: true,
            username: `guest_${Math.random().toString(36).substring(2, 10)}`,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create guest account');

      // Track guest creation
      posthog.capture('guest_created', {
        guest_id: data.user.id,
      });

      dispatch({ type: 'GUEST_CREATED', guestId: data.user.id });
      
      return data.user.id;
    } catch (error) {
      dispatch({ 
        type: 'SIGN_IN_ERROR', 
        error: error instanceof Error ? error : new Error('Failed to create guest') 
      });
      throw error;
    }
  }

  async function linkGuestToUser(email: string) {
    if (!state.user?.isGuest) return;
    
    try {
      dispatch({ type: 'SIGN_IN_STARTED' });
      
      // Store the guest ID before signing out
      const guestId = state.user.id;
      
      // Sign out the guest
      await supabase.auth.signOut();
      
      // Send magic link to the parent's email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/link-account?guest_id=${guestId}`,
          data: {
            is_parent: true,
          },
        },
      });

      if (error) throw error;

      // Track account linking attempt
      posthog.capture('cta_clicked', {
        type: 'link_account',
        method: 'email',
      });

    } catch (error) {
      dispatch({ 
        type: 'SIGN_IN_ERROR', 
        error: error instanceof Error ? error : new Error('Failed to link accounts') 
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
    createGuest,
    linkGuestToUser,
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
