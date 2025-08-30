import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { touchTarget } from '@/styles/accessibility';

type TouchTargetProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The component to render as the root element
   * @default 'button'
   */
  as?: React.ElementType;
  /**
   * Whether to apply touch target styles
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether the element is inline
   * @default false
   */
  inline?: boolean;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Children to render inside the touch target
   */
  children: React.ReactNode;
};

/**
 * A component that ensures its children have a minimum touch target size of 44x44px
 * and proper focus states for accessibility.
 */
const TouchTarget = forwardRef<HTMLElement, TouchTargetProps>(({
  as: Component = 'button',
  enabled = true,
  inline = false,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <StyledTouchTarget
      as={Component}
      ref={ref}
      className={`touch-target ${className}`}
      $enabled={enabled}
      $inline={inline}
      {...props}
    >
      {children}
    </StyledTouchTarget>
  );
});

TouchTarget.displayName = 'TouchTarget';

const StyledTouchTarget = styled.div<{ $enabled: boolean; $inline: boolean }>`
  display: ${({ $inline }) => ($inline ? 'inline-flex' : 'flex')};
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  vertical-align: middle;
  text-decoration: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  width: auto;
  height: auto;
  min-width: ${({ $enabled }) => ($enabled ? 'var(--spacing-11, 2.75rem)' : 'auto')};
  min-height: ${({ $enabled }) => ($enabled ? 'var(--spacing-11, 2.75rem)' : 'auto')};
  
  /* Focus styles */
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(0, 188, 212, 0.2);
  }
  
  /* High contrast mode */
  @media (forced-colors: active) {
    border: 2px solid transparent;
  }
  
  /* When disabled */
  &[disabled] {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  /* For links that wrap the component */
  a &,
  button & {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  /* For icons or other inline content */
  > * {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  
  /* For text content */
  > span {
    white-space: normal;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    line-height: 1.2;
  }
`;

export { TouchTarget };

/**
 * A higher-order component that adds touch target padding to a component
 */
export function withTouchTarget<P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  options: { as?: React.ElementType; inline?: boolean } = {}
) {
  const { as: Component = 'div', inline = false } = options;
  
  return forwardRef<HTMLElement, P>((props, ref) => (
    <TouchTarget as={Component} inline={inline}>
      <WrappedComponent ref={ref} {...(props as P)} />
    </TouchTarget>
  ));
}
