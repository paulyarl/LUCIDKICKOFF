export const SW_UPDATE_EVENT = 'lucidcraft:sw-update-available';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const run = () => {
    const swUrl = '/sw.js';
    if (process.env.NODE_ENV === 'development') {
      // In development, check if the service worker exists and log any issues
      checkValidServiceWorker(swUrl);
    } else {
      // In production, register the service worker
      registerValidSW(swUrl);
    }
  };
  // React hydration can finish after `load` already fired — a `load` listener
  // added then would never run, leaving the SW unregistered.
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      const notifyUpdateAvailable = () => {
        window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT));
      };

      // A previous visit may already have a worker waiting for activation.
      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateAvailable();
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              notifyUpdateAvailable();
            } else {
              // Content is cached for offline use
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
      
      // Check for updates every hour
      setInterval(() => {
        registration.update().catch(err => 
          console.error('Error checking for service worker update:', err)
        );
      }, 60 * 60 * 1000);
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string) {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

// Update UI is emitted through SW_UPDATE_EVENT and rendered by PWAProvider.

// Handle service worker updates
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  // Only reload when the page was ALREADY controlled at load time — i.e. a
  // genuine update replacing an active worker. On a first-ever visit there is
  // no controller, so the initial activation also fires `controllerchange`;
  // reloading then interrupts whatever the user is doing (including an
  // in-flight client-side navigation, which tears React's render and surfaces
  // the error boundary). First installs don't need a reload: the SW only
  // serves subsequent navigations anyway. Updates are also surfaced through
  // PWAProvider's "Update Available" toast with a user-initiated reload.
  const hadControllerAtLoad = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtLoad) return;
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Export a function to unregister the service worker (useful for development)
export function unregister() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
