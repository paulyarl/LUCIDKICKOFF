'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InstallPrompt } from './InstallPrompt';
// The following features referenced alias paths that are not present in this app.
// To keep the app building and the UI rendering, we provide safe no-op stubs.
// If/when real implementations are added, replace these with proper imports.
// import { AutoBackupManager } from '@/components/backup/BackupButton';
// import { setupServiceWorkerMessaging } from '@/lib/sw/messaging';
// import { registerServiceWorker } from '@/lib/sw/register';

function AutoBackupManager() {
  // No-op placeholder; real auto-backup UI can be wired in later
  return null;
}

function setupServiceWorkerMessaging() {
  // No-op in development placeholder
}

function registerServiceWorker() {
  // No-op in development placeholder
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [showUpdateAvailable, setShowUpdateAvailable] = useState(false);
  const router = useRouter();

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show a message when coming back online
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: {
            type: 'success',
            message: 'You\'re back online',
            duration: 3000,
          },
        });
        window.dispatchEvent(event);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: {
            type: 'warning',
            message: 'You\'re currently offline',
            description: 'Some features may be limited.',
            duration: 5000,
          },
        });
        window.dispatchEvent(event);
      }
    };

    // Set initial online status
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
      setupServiceWorkerMessaging();
    }

    // Listen for service worker events
    const handleControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        // New content is available
        setShowUpdateAvailable(true);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OFFLINE_READY') {
        setShowOfflineReady(true);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [router]);

  // Handle update reload
  const handleUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Tell the service worker to skip waiting and activate the new version
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload the page to apply updates
    window.location.reload();
  };

  return (
    <>
      {children}
      
      {/* PWA Installation Prompt */}
      <InstallPrompt />
      
      {/* Auto Backup Manager */}
      <AutoBackupManager />
      
      {/* Offline Ready Toast */}
      {showOfflineReady && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-green-50 p-4 shadow-lg sm:left-auto sm:right-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">App Ready for Offline Use</p>
              <p className="mt-1 text-sm text-green-700">You can now use this app offline.</p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowOfflineReady(false)}
                  className="rounded-md bg-green-50 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Available Toast */}
      {showUpdateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-blue-50 p-4 shadow-lg sm:left-auto sm:right-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Update Available</p>
              <p className="mt-1 text-sm text-blue-700">A new version of the app is available.</p>
              <div className="mt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                >
                  Update Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateAvailable(false)}
                  className="rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-50 p-2 text-center text-sm text-yellow-800">
          <div className="container mx-auto flex items-center justify-center">
            <WifiOff className="mr-2 h-4 w-4" />
            <span>You are currently offline. Some features may be limited.</span>
          </div>
        </div>
      )}
    </>
  );
}

// Icons
function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WifiOff({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
        clipRule="evenodd"
      />
      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 015.916 5.92L7.38 7.384a8 8 0 00-1.61 1.039 1.649 1.649 0 00-.022 2.645 1.649 1.649 0 002.646.016 8 8 0 002.356-1.902l1.998 1.998a3.5 3.5 0 01-2.02.968z" />
    </svg>
  );
}
