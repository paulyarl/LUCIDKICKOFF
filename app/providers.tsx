'use client';

import React, { useEffect, useState, type ReactNode, useRef, createContext, useContext } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { PostHogProvider } from '@/lib/posthog.client';
import { Toaster as SonnerToaster } from 'sonner';
import { usePathname, useSearchParams } from 'next/navigation';
import { FocusTrap } from '@/components/focus-trap';
import { I18nProvider } from '@/lib/i18n/provider';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

// Type definitions for the providers module
declare module '@/app/providers' {
  export interface ProvidersProps {
    children: ReactNode;
    theme?: 'light' | 'dark' | 'system';
    defaultTheme?: 'light' | 'dark' | 'system';
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableAnalytics?: boolean;
  }
}

// Context for modal management
const ModalContext = createContext<{
  openModal: (content: ReactNode, options?: { onClose?: () => void }) => void;
  closeModal: () => void;
} | null>(null);

// Custom hook to use the modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Modal provider component
function ModalProvider({ children }: { children: ReactNode }) {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalOptions, setModalOptions] = useState<{ onClose?: () => void }>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<Element | null>(null);

  const openModal = (content: ReactNode, options: { onClose?: () => void } = {}) => {
    lastFocusedElement.current = document.activeElement;
    setModalContent(content);
    setModalOptions(options);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (modalOptions.onClose) {
      modalOptions.onClose();
    }
    setModalContent(null);
    // Restore body scroll
    document.body.style.overflow = '';
    // Return focus to the element that was focused before the modal opened
    if (lastFocusedElement.current instanceof HTMLElement) {
      lastFocusedElement.current.focus();
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!modalContent) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalContent]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalContent && (
        <FocusTrap
          isOpen={true}
          onClose={closeModal}
          closeOnEsc
          closeOnOutsideClick
          overlayClassName="bg-black/50 backdrop-blur-sm"
          className="max-w-2xl w-full p-6 bg-background rounded-lg shadow-xl"
        >
          {modalContent}
        </FocusTrap>
      )}
    </ModalContext.Provider>
  );
}

// Design system provider component
function DesignSystemProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Apply theme class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      root.classList.add(systemTheme);
    } else if (theme) {
      root.classList.add(theme);
    }

    // Set data-theme attribute for CSS custom properties
    root.setAttribute('data-theme', theme || 'system');
  }, [theme]);

  // Track page views with PostHog
  useEffect(() => {
    // This effect will run whenever the pathname or search parameters change
    // You can add PostHog page view tracking here if needed
  }, [pathname, searchParams]);

  // Add keyboard navigation styles
  useEffect(() => {
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    window.addEventListener('keydown', handleFirstTab);
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
    };
  }, []);

  return <>{children}</>;
}

// Error boundary component for the design system
class DesignSystemErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Design System Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl p-6 bg-background border border-border rounded-lg shadow-lg">
            <h2 className="text-2xl font-heading font-bold mb-4 text-red-600">
              Oops! Something went wrong
            </h2>
            <p className="mb-4">
              We're having trouble loading the application. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global styles component
function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        .js-focus-visible :focus:not(.focus-visible) {
          outline: none;
          box-shadow: none;
        }
        
        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .border {
            border-width: 2px;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `
    }} />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PostHogProvider>
        <ModalProvider>
          <DesignSystemProvider>
            <DesignSystemErrorBoundary>
              <I18nProvider>
                {children}
                <LanguageSwitcher />
              </I18nProvider>
              <SonnerToaster position="top-center" richColors />
              <GlobalStyles />
            </DesignSystemErrorBoundary>
          </DesignSystemProvider>
        </ModalProvider>
      </PostHogProvider>
    </ThemeProvider>
  );
}
