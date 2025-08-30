/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './apps/web/pages/**/*.{ts,tsx}',
    './apps/web/components/**/*.{ts,tsx}',
    './apps/web/app/**/*.{ts,tsx}',
    './apps/web/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Color palette
      colors: {
        // Primary colors (Cyan)
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        
        // Secondary colors (Coral)
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--color-secondary-dark) / <alpha-value>)',
        },
        
        // Neutral colors (Navy)
        neutral: {
          DEFAULT: 'rgb(var(--color-neutral) / <alpha-value>)',
          light: 'rgb(var(--color-neutral-light) / <alpha-value>)',
          dark: 'rgb(var(--color-neutral-dark) / <alpha-value>)',
        },
        
        // Background and surface colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        
        // Text colors
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        
        // Status colors
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        
        // Border colors
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-hover': 'rgb(var(--color-border-hover) / <alpha-value>)',
      },
      
      // Font families
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        heading: ['var(--font-heading)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      
      // Border radius
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      
      // Box shadow
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      
      // Spacing
      spacing: {
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '11': 'var(--spacing-11)', // Minimum touch target (44px)
        '12': 'var(--spacing-12)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
      },
      
      // Z-index
      zIndex: {
        dropdown: 'var(--z-index-dropdown)',
        sticky: 'var(--z-index-sticky)',
        fixed: 'var(--z-index-fixed)',
        modal: 'var(--z-index-modal)',
        toast: 'var(--z-index-toast)',
        tooltip: 'var(--z-index-tooltip)',
      },
      
      // Transitions
      transitionProperty: {
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
        transform: 'transform',
        opacity: 'opacity',
      },
      
      // Keyframes and animations
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      
      // Custom utilities
      screens: {
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
        'can-hover': { 'raw': '(hover: hover)' },
      },
      
      // Aspect ratios
      aspectRatio: {
        'mobile': '19.5/9',
        'tablet': '16/10',
        'desktop': '16/9',
        'square': '1/1',
      },
      
      // Custom variants
      variants: {
        extend: {
          backgroundColor: ['active', 'disabled'],
          textColor: ['active', 'disabled'],
          opacity: ['disabled'],
          cursor: ['disabled'],
        },
      },
      
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
