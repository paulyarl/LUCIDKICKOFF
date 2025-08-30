import type { ReactNode, ComponentType } from 'react';
import type { ThemeProviderProps } from 'next-themes/dist/types';

declare module '@/app/providers' {
  export interface ProvidersProps {
    children: ReactNode;
    theme?: ThemeProviderProps['attribute'];
    defaultTheme?: ThemeProviderProps['defaultTheme'];
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    enableAnalytics?: boolean;
  }

  export interface DesignSystemProviderProps {
    children: ReactNode;
  }

  export interface DesignSystemErrorBoundaryProps {
    children: ReactNode;
  }

  export function DesignSystemProvider(props: DesignSystemProviderProps): JSX.Element;
  
  export function Providers(props: { children: ReactNode }): JSX.Element;
}
