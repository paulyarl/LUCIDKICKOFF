// Google Analytics Measurement ID - replace with your actual ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Log page view
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const impersonated = (window as any).__IMPERSONATED ? 'true' : 'false';
    window.gtag('config', GA_MEASUREMENT_ID as string, {
      page_path: url,
      impersonated,
    });
  }
};

// Log specific events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const impersonated = (window as any).__IMPERSONATED ? 'true' : 'false';
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      impersonated,
    });
  }
};

// Log errors
export const logError = (error: Error, errorInfo?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      stack: error.stack,
      ...errorInfo,
    });
  }
};

// Track form submissions
export const trackFormSubmission = (formName: string) => {
  event({
    action: 'form_submit',
    category: 'Form',
    label: formName,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string) => {
  event({
    action: 'button_click',
    category: 'UI',
    label: buttonName,
  });
};
