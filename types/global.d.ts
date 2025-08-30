// Global type declarations

declare global {
  interface Window {
    // Google Analytics
    gtag: (
      type: 'config' | 'event' | 'consent',
      id: string,
      config?: Record<string, any>
    ) => void;
    
    // Add other global window properties here if needed
  }
}

export {};
