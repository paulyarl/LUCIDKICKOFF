// React 19 compatibility types
import * as React from 'react';

declare module 'react' {
  // Fix ReactNode compatibility between React versions
  type ReactNode = 
    | React.ReactElement
    | string
    | number
    | React.ReactFragment
    | React.ReactPortal
    | boolean
    | null
    | undefined;

  // Fix ForwardRefExoticComponent to be JSX compatible
  interface ForwardRefExoticComponent<P> {
    (props: P): ReactElement | null;
    readonly $$typeof: symbol;
    displayName?: string;
    defaultProps?: Partial<P>;
    propTypes?: any;
  }
}

// Global JSX namespace fix for React 19
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
