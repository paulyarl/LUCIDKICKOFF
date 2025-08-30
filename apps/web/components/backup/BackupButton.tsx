'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BackupButtonProps {
  onBackupComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BackupButton({
  onBackupComplete,
  variant = 'outline',
  size = 'default',
  className = '',
}: BackupButtonProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    
    try {
      // In a real app, this would call your backup API
      // For now, we'll simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful backup
      const now = new Date();
      setLastBackup(now);
      
      // Store the last backup time in localStorage
      localStorage.setItem('lastBackup', now.toISOString());
      
      // Show success message
      toast.success('Backup completed successfully', {
        description: `Your artwork has been backed up.`,
      });
      
      // Call the onBackupComplete callback if provided
      if (onBackupComplete) {
        onBackupComplete();
      }
      
      // Log the backup event
      console.log('Backup completed at', now);
      
    } catch (err) {
      console.error('Backup failed:', err);
      setError('Failed to create backup. Please try again.');
      
      toast.error('Backup failed', {
        description: 'There was an error creating your backup. Please check your connection and try again.',
      });
      
    } finally {
      setIsBackingUp(false);
    }
  };

  // Format the last backup time as a relative time string
  const formatLastBackup = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Check for existing backup time on component mount
  if (typeof window !== 'undefined' && !lastBackup) {
    const storedBackup = localStorage.getItem('lastBackup');
    if (storedBackup) {
      setLastBackup(new Date(storedBackup));
    }
  }

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <Button
        onClick={handleBackup}
        disabled={isBackingUp}
        variant={variant}
        size={size}
        className="gap-2"
      >
        {isBackingUp ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Backing Up...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {lastBackup ? 'Back Up Now' : 'Create Backup'}
          </>
        )}
      </Button>
      
      <div className="mt-1 flex items-center text-xs text-muted-foreground">
        {isBackingUp ? (
          <span className="flex items-center">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Creating backup...
          </span>
        ) : error ? (
          <span className="flex items-center text-destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            {error}
          </span>
        ) : lastBackup ? (
          <span className="flex items-center">
            <Check className="mr-1 h-3 w-3 text-green-500" />
            Last backup: {formatLastBackup(lastBackup)}
          </span>
        ) : (
          <span>No backups yet</span>
        )}
      </div>
    </div>
  );
}

// Helper component to automatically trigger backups periodically
export function AutoBackupManager() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastBackupAttempt, setLastBackupAttempt] = useState<number | null>(null);
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check if it's time to back up (every hour)
  useEffect(() => {
    if (!isOnline) return;
    
    const checkBackup = async () => {
      const now = Date.now();
      const lastBackupTime = localStorage.getItem('lastBackup');
      const backupInterval = 60 * 60 * 1000; // 1 hour
      
      // Don't attempt backup too frequently
      if (lastBackupAttempt && now - lastBackupAttempt < backupInterval) {
        return;
      }
      
      // If we've never backed up or it's been more than the interval
      if (!lastBackupTime || (now - new Date(lastBackupTime).getTime() > backupInterval)) {
        setLastBackupAttempt(now);
        
        try {
          // In a real app, this would trigger the backup
          console.log('Auto-backup started');
          // Simulate backup
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update last backup time
          localStorage.setItem('lastBackup', new Date().toISOString());
          console.log('Auto-backup completed');
          
        } catch (error) {
          console.error('Auto-backup failed:', error);
        }
      }
    };
    
    // Check every 5 minutes
    const interval = setInterval(checkBackup, 5 * 60 * 1000);
    
    // Initial check
    checkBackup();
    
    return () => clearInterval(interval);
  }, [isOnline, lastBackupAttempt]);
  
  return null; // This component doesn't render anything
}
