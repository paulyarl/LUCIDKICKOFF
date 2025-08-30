import { css } from 'styled-components';
import { spacing } from './design-tokens';

/**
 * Ensures interactive elements meet the minimum touch target size of 44x44px
 * Usage: ${touchTarget} or ${touchTarget.inline}
 */
export const touchTarget = {
  // For block elements (default)
  base: css`
    min-width: ${spacing[11]};
    min-height: ${spacing[11]};
  `,
  // For inline elements (like icons)
  inline: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: ${spacing[11]};
    min-height: ${spacing[11]};
  `,
} as const;

/**
 * Focus ring styles that match the design system
 * Usage: ${focusRing} or ${focusRing.visible}
 */
export const focusRing = {
  // Default focus ring (visible on focus-visible)
  base: css`
    &:focus-visible {
      ${focusRing.visible}
    }
  `,
  // Always visible focus ring (for programmatic focus)
  visible: css`
    outline: 2px solid var(--color-accent-light);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(63, 81, 181, 0.2);
  `,
  // For dark mode
  dark: css`
    &:focus-visible {
      outline: 2px solid var(--color-accent-dark);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(121, 134, 203, 0.3);
    }
  `,
} as const;

/**
 * Visually hides an element but keeps it accessible to screen readers
 */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

/**
 * Shows an element only when focused (for skip links)
 */
export const showOnFocus = css`
  ${visuallyHidden}
  
  &:focus-visible {
    position: static;
    width: auto;
    height: auto;
    clip: auto;
    white-space: normal;
    padding: ${spacing[2]} ${spacing[4]};
    margin: ${spacing[2]};
    background: var(--color-background-light);
    color: var(--color-text-primary);
    z-index: ${({ theme }) => theme.zIndex.skipLink};
  }
`;

/**
 * Screen reader only text
 */
export const srOnly = visuallyHidden;

/**
 * Hides content visually but keeps it accessible to screen readers
 */
export const screenReaderOnly = visuallyHidden;

/**
 * Mixin for high contrast mode support
 */
export const highContrast = {
  outline: css`
    @media (forced-colors: active) {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  `,
  text: css`
    @media (forced-colors: active) {
      -webkit-text-fill-color: CanvasText;
    }
  `,
} as const;

/**
 * Reduced motion utilities
 */
export const reducedMotion = {
  /**
   * Only apply styles when reduced motion is NOT preferred
   */
  notPreferred: (styles: TemplateStringsArray) => css`
    @media (prefers-reduced-motion: no-preference) {
      ${styles}
    }
  `,
  /**
   * Only apply styles when reduced motion IS preferred
   */
  preferred: (styles: TemplateStringsArray) => css`
    @media (prefers-reduced-motion: reduce) {
      ${styles}
    }
  `,
} as const;

/**
 * Helper to generate ARIA attributes based on component state
 */
export const ariaAttr = (condition: boolean) => (condition ? 'true' : undefined);
