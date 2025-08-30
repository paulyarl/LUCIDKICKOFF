// Test-only global augmentations

export {};

declare global {
  interface Window {
    posthog?: { capture: (event: string, props?: any) => void };
    lastPostHogEvent?: any;
    __FEATURES__?: Record<string, boolean>;
    __ENABLE_FEATURE__?: (name: string) => void;
    [key: string]: any;
  }

  interface WindowEventMap {
    'stroke_committed': CustomEvent<any>;
  }
}
