'use client';

import { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// The ErrorBoundary from the library is now the primary export for this module.
export const ErrorBoundary = ReactErrorBoundary;

interface ErrorMessageProps {
  error: Error | string | null | undefined;
  className?: string;
  showIcon?: boolean;
  retry?: () => void;
}

export function ErrorMessage({ 
  error, 
  className, 
  showIcon = true, 
  retry 
}: ErrorMessageProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred';

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-4 text-center rounded-lg bg-destructive/10 text-destructive',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {showIcon && <AlertTriangle className="w-4 h-4" />}
        <span className="text-sm">{errorMessage}</span>
      </div>
      {retry && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 text-xs"
          onClick={retry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

interface ErrorFallbackProps {
  error: Error | string | null | undefined;
  resetErrorBoundary?: () => void;
  className?: string;
}

export function ErrorFallback({ 
  error, 
  resetErrorBoundary, 
  className 
}: ErrorFallbackProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Something went wrong';
  
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-6 space-y-4 text-center',
        className
      )}
      role="alert"
    >
      <div className="p-3 rounded-full bg-destructive/20">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Something went wrong</h3>
      <p className="text-sm text-muted-foreground">
        {errorMessage}
      </p>
      {resetErrorBoundary && (
        <Button
          variant="outline"
          onClick={resetErrorBoundary}
          className="mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}

interface QueryErrorProps {
  error: unknown;
  refetch?: () => void;
  className?: string;
  showRetry?: boolean;
}

export function QueryError({ 
  error, 
  refetch, 
  className,
  showRetry = true
}: QueryErrorProps) {
  let errorMessage = 'An error occurred while fetching data';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center p-4 space-y-2 text-center',
        className
      )}
    >
      <AlertTriangle className="w-5 h-5 text-destructive" />
      <p className="text-sm text-muted-foreground">
        {errorMessage}
      </p>
      {showRetry && refetch && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
