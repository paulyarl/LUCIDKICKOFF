'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface FocusTrapProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function FocusTrap({
  children,
  isOpen,
  onClose,
  initialFocusRef,
  returnFocusRef,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  className = '',
  overlayClassName = '',
}: FocusTrapProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<Element | null>(null);

  // Handle focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element to return focus later
    lastFocusedElement.current = document.activeElement;

    // Focus the modal or the element specified by initialFocusRef
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    // Get all focusable elements in the modal
    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

    // Handle tab key navigation within the modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle clicks outside the modal
    const handleClickOutside = (e: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        onClose &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      // Return focus to the element that was focused before the modal opened
      if (returnFocusRef?.current) {
        returnFocusRef.current.focus();
      } else if (lastFocusedElement.current instanceof HTMLElement) {
        lastFocusedElement.current.focus();
      }
    };
  }, [isOpen, initialFocusRef, returnFocusRef, closeOnEsc, closeOnOutsideClick, onClose]);

  // Don't render anything if the modal is closed
  if (!isOpen) return null;

  // Create a portal for the modal to render outside the normal DOM hierarchy
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl transition-all ${className}`}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
