# Analytics & Monitoring Guide

This guide explains how to use the analytics and monitoring system in the LucidKickoff application.

## Table of Contents
- [Setup](#setup)
- [Event Tracking](#event-tracking)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [User Identification](#user-identification)
- [Example Usage](#example-usage)
- [Testing & Development](#testing--development)
- [Troubleshooting](#troubleshooting)

## Setup

### Environment Variables

Copy the `.env.local.example` file to `.env.local` and update the following variables:

```env
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Installation

Make sure all required dependencies are installed:

```bash
npm install @sentry/nextjs posthog-js zod
```

## Event Tracking

### Basic Event Tracking

```typescript
import { trackEvent } from '@/lib/analytics';

// Track a custom event
trackEvent({
  event: 'button_click',
  buttonId: 'signup_button',
  page: 'landing',
  metadata: {
    test_variant: 'blue_button'
  }
});
```

### Predefined Event Types

The following event types are available:

- `page_view` - Track page views
- `button_click` - Track button clicks
- `form_submit` - Track form submissions
- `error` - Track errors
- `performance_metric` - Track performance metrics
- `user_identified` - Track user identification

## Error Tracking

### Catching and Reporting Errors

```typescript
import { captureException } from '@/lib/analytics/sentry';

try {
  // Your code here
} catch (error) {
  captureException(error, {
    context: 'user_registration',
    userId: user.id,
    // Additional context
  });
}
```

### Using the Error Boundary

Wrap your application with the `ErrorBoundary` component to catch React errors:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Performance Monitoring

### Tracking Performance Metrics

```typescript
import { trackPerformance } from '@/lib/analytics';

// Start timing
const startTime = performance.now();

// Your code here

// Track duration
trackPerformance('api_call_duration', performance.now() - startTime);
```

### Monitoring Page Load Performance

Page load performance is automatically tracked. You can add custom spans:

```typescript
import { startTransaction, getActiveTransaction } from '@sentry/nextjs';

const transaction = startTransaction({
  name: 'My Transaction',
  op: 'task',
});

// Later...
const span = transaction.startChild({ op: 'functionX' });
// Function X logic
span.finish();

transaction.finish();
```

## User Identification

### Identifying Users

```typescript
import { identifyUser } from '@/lib/analytics';

// When a user logs in
identifyUser(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan,
  // Any other user properties
});

// When a user logs out
import { resetUser } from '@/lib/analytics';
resetUser();
```

## Example Usage

### Tracking a Button Click

```tsx
import { trackEvent } from '@/lib/analytics';

function SignupButton() {
  const handleClick = () => {
    trackEvent({
      event: 'button_click',
      buttonId: 'signup_button',
      location: 'hero_section',
      test_variant: 'green_button'
    });
    // Rest of the click handler
  };

  return (
    <button onClick={handleClick}>
      Sign Up Now
    </button>
  );
}
```

### Tracking Form Submissions

```tsx
import { trackEvent } from '@/lib/analytics';

function ContactForm() {
  const handleSubmit = (data) => {
    trackEvent({
      event: 'form_submit',
      formName: 'contact',
      formData: {
        name: data.name,
        email: data.email,
        // Don't include sensitive data
      }
    });
    // Submit the form
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Testing & Development

### Disabling Analytics in Development

Set the following in your `.env.local`:

```env
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=false
NEXT_PUBLIC_DEBUG_ANALYTICS=true
```

### Testing Event Tracking

Events will be logged to the console when `NEXT_PUBLIC_DEBUG_ANALYTICS=true`.

## Troubleshooting

### Events Not Showing Up in PostHog

1. Check the browser console for any errors
2. Verify your PostHog API key and host are correct
3. Ensure the user hasn't opted out of tracking
4. Check for ad blockers that might be blocking the requests

### Errors Not Showing Up in Sentry

1. Verify your Sentry DSN is correct
2. Check that `NEXT_PUBLIC_ENABLE_ERROR_TRACKING` is set to `true`
3. Check the browser console for any initialization errors
4. Ensure the environment is set correctly in your Sentry project settings

### Performance Data Not Showing

1. Check that `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING` is set to `true`
2. Verify that the sample rate is not set too low
3. Check the browser's network tab for any failed requests to Sentry

## Best Practices

1. **Don't track sensitive data** - Never include PII or sensitive information in your events
2. **Use consistent event names** - Follow a consistent naming convention (e.g., `noun_verb`)
3. **Keep event payloads small** - Only include necessary data
4. **Use user properties** - Store user attributes as user properties rather than in every event
5. **Test in development** - Always test your tracking in development before deploying to production
