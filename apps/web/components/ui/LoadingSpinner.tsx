import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div 
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  show = true, 
  fullScreen = false,
  className
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div 
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50',
        fullScreen ? 'fixed inset-0' : 'rounded-lg',
        className
      )}
    >
      <LoadingSpinner size="lg" className="text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}

export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span>{message}</span>
    </div>
  );
}

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function LoadingSkeleton({ 
  count = 1, 
  className,
  itemClassName,
  ...props 
}: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'animate-pulse bg-muted rounded-md',
            itemClassName || 'h-4 w-full',
            itemClassName?.includes('h-') ? '' : 'h-4',
            itemClassName?.includes('w-') ? '' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}
