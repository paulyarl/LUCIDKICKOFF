import { toast } from 'sonner';

// Types for message handling
type MessageType = 
  | 'CACHE_CANVAS'
  | 'CLEAR_CANVAS_CACHE'
  | 'QUEUE_REQUEST'
  | 'CHECK_SYNC_STATUS'
  | 'SYNC_SUCCESS'
  | 'SYNC_CONFLICT';

interface Message {
  type: MessageType;
  payload?: any;
}

// Cache the active canvas
export async function cacheCanvas(canvasId: string, data: any) {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send message to service worker
    registration.active?.postMessage({
      type: 'CACHE_CANVAS',
      payload: { canvasId, data }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to cache canvas:', error);
    return false;
  }
}

// Clear the canvas cache
export async function clearCanvasCache() {
  if (!('serviceWorker' in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'CLEAR_CANVAS_CACHE'
    });
    return true;
  } catch (error) {
    console.error('Failed to clear canvas cache:', error);
    return false;
  }
}

// Queue a request for background sync
export async function queueRequest(url: string, options: RequestInit) {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    // Fallback to regular fetch if background sync isn't supported
    return fetch(url, options);
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Add to IndexedDB or similar for the service worker to process
    // This is a simplified example - in a real app, you'd use a more robust solution
    const request = new Request(url, options);
    const clonedRequest = request.clone();
    
    // Store the request in IndexedDB
    await storeRequestInIndexedDB({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    });
    
    // Register for sync
    try {
      await registration.sync.register('sync-artwork');
      console.log('Background sync registered');
    } catch (err) {
      console.error('Background sync registration failed:', err);
      // Fall back to normal fetch if sync registration fails
      return fetch(clonedRequest);
    }
    
    // Return a response indicating the request was queued
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Request queued for background sync' 
    }), { 
      status: 202, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Failed to queue request:', error);
    // Fall back to normal fetch if something goes wrong
    return fetch(url, options);
  }
}

// Listen for messages from the service worker
export function setupServiceWorkerMessaging() {
  if (!('serviceWorker' in navigator)) return;
  
  navigator.serviceWorker.addEventListener('message', (event) => {
    const message: Message = event.data;
    
    switch (message.type) {
      case 'SYNC_SUCCESS':
        handleSyncSuccess(message.payload);
        break;
        
      case 'SYNC_CONFLICT':
        handleSyncConflict(message.payload);
        break;
        
      default:
        console.log('Unhandled message from service worker:', message);
    }
  });
}

// Handle successful sync
function handleSyncSuccess(payload: any) {
  const { url } = payload;
  
  toast.success('Changes synced successfully', {
    description: 'Your work has been saved to the server.',
    duration: 3000,
  });
  
  // You could also update the UI to reflect the sync status
  const syncStatusElements = document.querySelectorAll('[data-sync-status]');
  syncStatusElements.forEach(el => {
    if (el.getAttribute('data-sync-url') === url) {
      el.setAttribute('data-sync-status', 'synced');
      setTimeout(() => {
        el.remove();
      }, 3000);
    }
  });
}

// Handle sync conflicts
function handleSyncConflict(payload: any) {
  const { serverVersion, localVersion, url } = payload;
  
  // Show a toast with conflict resolution options
  toast.warning('Conflict Detected', {
    description: 'There are conflicting versions of this artwork.',
    action: {
      label: 'Resolve',
      onClick: () => showConflictResolution(serverVersion, localVersion, url)
    },
    duration: 10000,
  });
}

// Show conflict resolution UI
function showConflictResolution(serverVersion: any, localVersion: any, url: string) {
  // This would show a modal or dialog in a real app
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  
  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 100%;">
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">
        Resolve Conflict
      </h2>
      <p style="margin-bottom: 1.5rem; color: #4b5563;">
        There are conflicting versions of this artwork. Which version would you like to keep?
      </p>
      
      <div style="margin-bottom: 1.5rem;">
        <div style="margin-bottom: 1rem;">
          <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <input type="radio" name="version" value="server" checked style="margin-right: 0.5rem;">
            <span>Server Version</span>
            <span style="margin-left: 0.5rem; font-size: 0.875rem; color: #6b7280;">
              (Saved ${new Date(serverVersion.updatedAt).toLocaleString()})
            </span>
          </label>
          <div style="padding-left: 1.5rem; color: #4b5563; font-size: 0.875rem;">
            ${serverVersion.title || 'Untitled'} (${serverVersion.width}×${serverVersion.height})
          </div>
        </div>
        
        <div>
          <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <input type="radio" name="version" value="local" style="margin-right: 0.5rem;">
            <span>This Device</span>
            <span style="margin-left: 0.5rem; font-size: 0.875rem; color: #6b7280;">
              (Saved ${new Date(localVersion.updatedAt).toLocaleString()})
            </span>
          </label>
          <div style="padding-left: 1.5rem; color: #4b5563; font-size: 0.875rem;">
            ${localVersion.title || 'Untitled'} (${localVersion.width}×${localVersion.height})
          </div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button id="cancel-resolve" style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: white;">
          Cancel
        </button>
        <button id="resolve-conflict" style="padding: 0.5rem 1rem; border-radius: 0.375rem; background: #3b82f6; color: white; border: none;">
          Resolve
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle resolution
  const resolveButton = modal.querySelector('#resolve-conflict');
  const cancelButton = modal.querySelector('#cancel-resolve');
  
  if (resolveButton) {
    resolveButton.addEventListener('click', async () => {
      const selectedVersion = modal.querySelector('input[name="version"]:checked')?.value;
      
      try {
        // Send the resolution to the server
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: selectedVersion,
            serverVersion,
            localVersion
          }),
        });
        
        if (!response.ok) throw new Error('Failed to resolve conflict');
        
        // Show success message
        toast.success('Conflict resolved successfully');
        
        // Reload the page to show the resolved version
        window.location.reload();
        
      } catch (error) {
        console.error('Error resolving conflict:', error);
        toast.error('Failed to resolve conflict');
      } finally {
        modal.remove();
      }
    });
  }
  
  // Handle cancel
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
  }
}

// Helper function to store requests in IndexedDB
async function storeRequestInIndexedDB(request: any) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('offline-requests', 1);
    
    openRequest.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    openRequest.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('requests', 'readwrite');
      const store = transaction.objectStore('requests');
      
      const addRequest = store.add({
        ...request,
        timestamp: Date.now()
      });
      
      addRequest.onsuccess = () => {
        resolve(true);
      };
      
      addRequest.onerror = () => {
        reject(new Error('Failed to store request'));
      };
    };
    
    openRequest.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
  });
}

// Initialize the service worker messaging
if (typeof window !== 'undefined') {
  setupServiceWorkerMessaging();
}
