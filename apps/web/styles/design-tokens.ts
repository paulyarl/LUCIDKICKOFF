// Design Tokens for LucidKickoff

// Typography
export const fonts = {
  heading: 'var(--font-montserrat)',
  body: 'var(--font-opensans)',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const fontSizes = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
} as const;

// Color Palette
const colors = {
  // Primary Colors
  cyan: {
    50: '#e0f7fa',
    100: '#b2ebf2',
    200: '#80deea',
    300: '#4dd0e1',
    400: '#26c6da',
    500: '#00bcd4', // Base cyan
    600: '#00acc1',
    700: '#0097a7',
    800: '#00838f',
    900: '#006064',
  },
  coral: {
    50: '#fff3f0',
    100: '#ffe0d6',
    200: '#ffc7b8',
    300: '#ffa899',
    400: '#ff8a7a',
    500: '#ff6b6b', // Base coral
    600: '#f25c54',
    700: '#e74c3c',
    800: '#db3e2d',
    900: '#c0392b',
  },
  navy: {
    50: '#e8eaf6',
    100: '#c5cae9',
    200: '#9fa8da',
    300: '#7986cb',
    400: '#5c6bc0',
    500: '#3f51b5', // Base navy
    600: '#3949ab',
    700: '#303f9f',
    800: '#283593',
    900: '#1a237e',
  },
  // Neutral Colors
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Semantic Colors
  success: {
    50: '#e8f5e9',
    500: '#4caf50',
    700: '#388e3c',
  },
  warning: {
    50: '#fff8e1',
    500: '#ffc107',
    700: '#ffa000',
  },
  error: {
    50: '#ffebee',
    500: '#f44336',
    700: '#d32f2f',
  },
  // Background and Surface
  background: {
    light: '#ffffff',
    dark: '#121212',
  },
  surface: {
    light: '#ffffff',
    dark: '#1e1e1e',
  },
} as const;

// Device Aspect Ratios (width:height)
export const aspectRatios = {
  tablet: 16 / 10,      // 16:10
  mobile: 19.5 / 9,     // 19.5:9
  desktop: 16 / 9,      // 16:9
  square: 1,            // 1:1
} as const;

// Spacing (in rem)
export const spacing = {
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px (minimum touch target)
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Border Radius
export const radii = {
  none: '0',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Box Shadow
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// Z-Index
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Export colors with semantic names
export const colors = {
  ...colors,
  primary: {
    light: colors.cyan[500],
    dark: colors.cyan[300],
  },
  secondary: {
    light: colors.coral[500],
    dark: colors.coral[300],
  },
  accent: {
    light: colors.navy[500],
    dark: colors.navy[300],
  },
  text: {
    primary: {
      light: colors.gray[900],
      dark: colors.gray[50],
    },
    secondary: {
      light: colors.gray[600],
      dark: colors.gray[300],
    },
    disabled: {
      light: colors.gray[400],
      dark: colors.gray[500],
    },
  },
  border: {
    light: colors.gray[200],
    dark: colors.gray[700],
  },
  // Alias for backward compatibility
  cyan: colors.cyan,
  coral: colors.coral,
  navy: colors.navy,
  gray: colors.gray,
} as const;

// Export type for TypeScript
export type ColorPalette = keyof typeof colors;
export type FontWeight = keyof typeof fontWeights;
export type FontSize = keyof typeof fontSizes;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof radii;
export type BoxShadow = keyof typeof boxShadow;
export type ZIndex = keyof typeof zIndex;
