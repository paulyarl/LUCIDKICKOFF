'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Check if the app is running as a standalone PWA
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    // Check if the browser is Safari on iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      
      setIsIOS(isIOS);
      setIsSafari(isSafari);
    };

    checkIOS();
    setIsStandalone(isInStandaloneMode());

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default install prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      window.deferredPrompt = e;
      
      // Show the install button
      if (!isInStandaloneMode()) {
        setIsVisible(true);
      }
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed
    if (isInStandaloneMode()) {
      setIsVisible(false);
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Hide the install prompt
    setIsVisible(false);
    
    // Show the install prompt
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await window.deferredPrompt.userChoice;
      
      // Optionally, send analytics about the install choice
      console.log(`User response to the install prompt: ${outcome}`);
      
      // We've used the prompt, and can't use it again, throw it away
      window.deferredPrompt = null;
    } else if (isIOS && isSafari) {
      // For iOS Safari, show instructions
      showIOSInstallInstructions();
    } else {
      // Fallback for browsers that don't support the install prompt
      toast.info('Your browser does not support installing this app directly.');
    }
  };

  const showIOSInstallInstructions = () => {
    toast.info(
      <div className="space-y-2">
        <p>To install this app on your device:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Tap the Share button <Share2 className="inline h-4 w-4" /></li>
          <li>Select "Add to Home Screen"</li>
          <li>Tap "Add" in the top-right corner</li>
        </ol>
      </div>,
      {
        duration: 10000,
        icon: <Smartphone className="h-5 w-5" />,
      }
    );
  };

  // Don't show the install prompt if the app is already installed or not visible
  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium">Install LucidKickoff</h3>
          <p className="text-sm text-muted-foreground">
            Add to your home screen for easy access and better experience.
          </p>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          Not Now
        </Button>
        
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isIOS ? 'Install' : 'Install App'}
        </Button>
      </div>
    </div>
  );
}
