export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      if (process.env.NODE_ENV === 'development') {
        // In development, check if the service worker exists and log any issues
        checkValidServiceWorker(swUrl);
      } else {
        // In production, register the service worker
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; show update notification
              console.log('New content is available; please refresh.');
              
              // You can show a custom UI to prompt the user to refresh
              showUpdateNotification();
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

function showUpdateNotification() {
  // This is a simple notification - you can customize this to match your app's UI
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '12px 20px';
  notification.style.backgroundColor = '#fff';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.zIndex = '1000';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.gap = '12px';
  
  notification.innerHTML = `
    <div>
      <div style="font-weight: 500; margin-bottom: 4px;">Update Available</div>
      <div style="font-size: 14px; color: #666;">A new version is available.</div>
    </div>
    <button 
      id="sw-update-button"
      style="
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
        flex-shrink: 0;
      "
    >
      Update
    </button>
  `;
  
  document.body.appendChild(notification);
  
  const updateButton = notification.querySelector('#sw-update-button');
  if (updateButton) {
    updateButton.addEventListener('click', () => {
      // Tell the service worker to skip waiting and activate the new version
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Reload the page to apply updates
      window.location.reload();
    });
  }
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 10000);
}

// Handle service worker updates
if ('serviceWorker' in navigator) {
  // Listen for the controlling service worker changing and reload the page
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Export a function to unregister the service worker (useful for development)
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
