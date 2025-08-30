import posthog from 'posthog-js';
import { captureException, captureMessage, addBreadcrumb } from './sentry';
import { AnalyticsEvent, validateEvent } from './events';

// Track a custom event
export function trackEvent<T extends AnalyticsEvent>(event: T) {
  try {
    // Validate the event against our schema
    const validatedEvent = validateEvent(event);
    
    // Add common properties
    const enrichedEvent = {
      ...validatedEvent,
      timestamp: Date.now(),
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };

    // Send to PostHog
    posthog.capture(validatedEvent.event, enrichedEvent);
    
    // Add to Sentry breadcrumbs for error context
    addBreadcrumb({
      category: 'analytics',
      message: `Event: ${validatedEvent.event}`,
      level: 'info',
      data: enrichedEvent,
    });
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', enrichedEvent);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to track event:', error, event);
    captureException(error as Error, { context: 'analytics:trackEvent', event });
    return false;
  }
}

// Track page views
export function trackPageView(url: string) {
  posthog.capture('$pageview', { $current_url: url });
  
  addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${url}`,
    level: 'info',
    data: { url },
  });
}

// Track errors
export function trackError(error: Error, context: Record<string, any> = {}) {
  const errorEvent = {
    event: 'error' as const,
    errorType: error.name,
    errorMessage: error.message,
    stackTrace: error.stack,
    context,
  };
  
  // Send to PostHog
  trackEvent(errorEvent);
  
  // Also send to Sentry
  captureException(error, context);
}

// Track performance metrics
export function trackPerformance(metricName: string, value: number, unit: 'ms' | 's' | 'bytes' = 'ms') {
  return trackEvent({
    event: 'performance_metric',
    metricName,
    value,
    unit,
  });
}

// Track brush stroke performance
export function trackBrushPerformance(strokeLength: number, duration: number, brushType: string) {
  // Track the raw data point
  trackEvent({
    event: 'brush_stroke',
    brushType,
    strokeLength,
    duration,
    canvasId: 'current', // This should be replaced with actual canvas ID
  });
  
  // Track as a performance metric for aggregation
  trackPerformance('brush_latency_p50', duration);
}

// Track save operations
export function trackSave(canvasId: string, method: 'auto' | 'manual' | 'background', success: boolean, error?: string, duration?: number, size?: number) {
  return trackEvent({
    event: 'save',
    canvasId,
    method,
    success,
    error,
    duration,
    size,
  });
}

// Track user interactions
export function trackInteraction(element: string, action: string, value?: any) {
  return trackEvent({
    event: 'interaction',
    element,
    action,
    value,
  });
}

// Track session events
export function trackSession(type: 'start' | 'end' | 'extend', duration?: number, reason?: string) {
  return trackEvent({
    event: 'session',
    type,
    duration,
    reason,
  });
}

// Identify the current user
export function identifyUser(userId: string, traits: Record<string, any> = {}) {
  try {
    posthog.identify(userId, traits);
    
    // Also set user in Sentry if needed
    if (window.Sentry) {
      window.Sentry.setUser({
        id: userId,
        ...traits,
      });
    }
    
    // Track the identification event
    trackEvent({
      event: 'user_identified',
      userId,
      ...traits,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to identify user:', error);
    captureException(error as Error, { context: 'analytics:identifyUser', userId });
    return false;
  }
}

// Reset the user (on logout)
export function resetUser() {
  try {
    posthog.reset();
    
    // Also reset in Sentry if needed
    if (window.Sentry) {
      window.Sentry.configureScope(scope => scope.setUser(null));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to reset user:', error);
    captureException(error as Error, { context: 'analytics:resetUser' });
    return false;
  }
}

// Track time to first stroke
export function trackTimeToFirstStroke(duration: number) {
  return trackPerformance('time_to_first_stroke', duration);
}

// Track canvas load time
export function trackCanvasLoadTime(duration: number) {
  return trackPerformance('canvas_load_time', duration);
}

// Track save latency
export function trackSaveLatency(duration: number) {
  return trackPerformance('save_latency', duration);
}

export * from './posthog';
export * from './sentry';
