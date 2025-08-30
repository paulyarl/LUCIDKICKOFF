import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: `lucidkickoff@${process.env.npm_package_version}`,
    beforeSend(event) {
      if (event.request?.url?.includes('/api/health')) return null;
      return event;
    },
  });
}

// Helper to capture exceptions
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Captured error:', error, context);
    return;
  }
  
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}] ${message}`);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

// Helper to add breadcrumbs
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Breadcrumb:', breadcrumb);
    return;
  }
  
  Sentry.addBreadcrumb(breadcrumb);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string; username?: string; [key: string]: any }) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Set user:', user);
    return;
  }
  
  Sentry.setUser(user);
}

// Helper to start a transaction (no-op if unavailable)
export function startTransaction(name: string, op?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Starting transaction: ${name} (${op})`);
    return {
      finish: () => console.log(`Finished transaction: ${name}`),
      setTag: (key: string, value: string) => console.log(`Set tag ${key}=${value}`),
      setData: (key: string, value: any) => console.log(`Set data ${key}=`, value),
    } as any;
  }
  
  const anyS = Sentry as any;
  if (typeof anyS.startTransaction === 'function') {
    return anyS.startTransaction({ name, op });
  }
  return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  } as any;
}
