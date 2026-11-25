'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { repo } from '@/lib/api/repository';
import { PinInput } from './PinInput';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PinGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const router = useRouter();
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if parent is already authenticated
  useEffect(() => {
    checkAuthStatus();
    
    // Set up auto-lock after 5 minutes of inactivity
    let timeoutId: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Set new timeout for 5 minutes
      if (isAuthenticated) {
        timeoutId = setTimeout(() => {
          handleLock();
        }, LOCK_DURATION);
      }
    };
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });
    
    // Initial setup
    resetInactivityTimer();
    
    // Clean up
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const session = await repo.auth.session();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Check if user has a parent PIN set up
      const pinData = await repo.family.pins.get();
      
      if (pinData) {
        setFailedAttempts(pinData.failed_attempts || 0);
        
        if (pinData.locked_until) {
          const lockTime = new Date(pinData.locked_until).getTime();
          const now = new Date().getTime();
          
          if (lockTime > now) {
            // Still locked
            setIsLocked(true);
            setLockUntil(new Date(lockTime));
            setIsLoading(false);
            return;
          } else {
            // Lock expired, reset failed attempts
            await repo.family.pins.update({ failed_attempts: 0, locked_until: null });
          }
        }
      }
      
      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoading(false);
      toast.error('An error occurred while checking authentication status');
    }
  };

  const handlePinSubmit = async (pin: string) => {
    try {
      setIsLoading(true);
      
      const session = await repo.auth.session();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Verify PIN
      const pinData = await repo.catalog.rpc('verify_parent_pin', {
        p_user_id: session.user.id,
        p_pin: pin
      });
      
      if (pinData?.is_valid) {
        // Reset failed attempts on successful login
        await repo.family.pins.update({ failed_attempts: 0, last_used_at: new Date().toISOString() });
        
        setIsAuthenticated(true);
        setFailedAttempts(0);
      } else {
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Lock after max attempts
        if (newFailedAttempts >= MAX_ATTEMPTS) {
          await handleLock();
          return;
        }
        
        // Update failed attempts in database
        await repo.family.pins.update({ failed_attempts: newFailedAttempts });
        
        throw new Error(`Incorrect PIN. ${MAX_ATTEMPTS - newFailedAttempts} attempts remaining.`);
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify PIN');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLock = async () => {
    try {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 5); // Lock for 5 minutes
      
      await repo.family.pins.upsert({
        locked_until: lockTime.toISOString(),
        failed_attempts: MAX_ATTEMPTS
      });
      
      setIsLocked(true);
      setLockUntil(lockTime);
      setFailedAttempts(MAX_ATTEMPTS);
      toast.error('Too many failed attempts. Please try again later.');
    } catch (error) {
      console.error('Error locking account:', error);
      toast.error('An error occurred while locking the account');
    }
  };
  
  const handleSignOut = async () => {
    await repo.auth.signOut();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isLocked && lockUntil) {
    const minutes = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Account Locked</h1>
          <p className="text-brand-navy/60">
            Too many failed attempts. Please try again in {minutes} minute{minutes !== 1 ? 's' : ''}.
          </p>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Parent Console</h1>
            <p className="text-brand-navy/60">
              Enter your PIN to access parent controls
            </p>
          </div>
          
          <PinInput 
            onComplete={handlePinSubmit}
            loading={isLoading}
            error={failedAttempts > 0 ? `Incorrect PIN. ${MAX_ATTEMPTS - failedAttempts} attempts remaining.` : undefined}
          />
          
          <div className="mt-4 text-center text-sm">
            <button
              onClick={handleSignOut}
              className="font-medium text-primary hover:underline"
              disabled={isLoading}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}
