'use client';

import { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      fallbackRender={() => fallback}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  );
}
