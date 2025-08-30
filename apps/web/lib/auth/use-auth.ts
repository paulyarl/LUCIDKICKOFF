'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type AuthResult = {
  success: boolean;
  error?: string;
};

type SignUpData = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'parent' | 'child';
};

type SignInData = {
  email: string;
  password: string;
};

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  // Get initial session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    };
    
    getSession();
  }, [supabase.auth]);

  const signUp = useCallback(async (data: SignUpData): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const signIn = useCallback(async (data: SignInData): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign out.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while resetting your password.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating your password.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  return {
    user,
    session,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
}

