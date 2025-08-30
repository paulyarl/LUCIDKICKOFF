import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { aspectRatios } from '@/styles/design-tokens';

type AspectRatioProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The aspect ratio to use (width / height)
   * @default 16/9
   */
  ratio?: number;
  /**
   * Predefined device aspect ratio
   * Overrides the ratio prop if both are provided
   */
  device?: 'mobile' | 'tablet' | 'desktop' | 'square';
  /**
   * Maximum width of the container
   */
  maxWidth?: string | number;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Border radius
   */
  borderRadius?: string;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Children to render inside the aspect ratio container
   */
  children: React.ReactNode;
};

/**
 * A component that maintains a specific aspect ratio for its children
 */
const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(({
  ratio = 16 / 9,
  device,
  maxWidth = '100%',
  backgroundColor = 'transparent',
  borderRadius = '0',
  className = '',
  children,
  style,
  ...props
}, ref) => {
  // Use device ratio if provided, otherwise use the ratio prop
  const aspectRatio = device ? aspectRatios[device] : ratio;
  
  return (
    <AspectRatioContainer
      ref={ref}
      className={`aspect-ratio ${className}`}
      $aspectRatio={aspectRatio}
      $maxWidth={maxWidth}
      $backgroundColor={backgroundColor}
      $borderRadius={borderRadius}
      style={style}
      {...props}
    >
      <AspectRatioContent>{children}</AspectRatioContent>
    </AspectRatioContainer>
  );
});

AspectRatio.displayName = 'AspectRatio';

const AspectRatioContainer = styled.div<{
  $aspectRatio: number;
  $maxWidth: string | number;
  $backgroundColor: string;
  $borderRadius: string;
}>`
  position: relative;
  width: 100%;
  max-width: ${({ $maxWidth }) => 
    typeof $maxWidth === 'number' ? `${$maxWidth}px` : $maxWidth};
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  border-radius: ${({ $borderRadius }) => $borderRadius};
  overflow: hidden;
  margin: 0 auto;
  
  /* Create the aspect ratio */
  &::before {
    content: '';
    display: block;
    padding-bottom: ${({ $aspectRatio }) => (1 / $aspectRatio) * 100}%;
    width: 100%;
  }
  
  /* For debugging */
  &[data-debug='true'] {
    outline: 2px dashed rgba(0, 0, 0, 0.2);
    outline-offset: -1px;
    
    &::after {
      content: '${({ $aspectRatio }) => $aspectRatio.toFixed(2)}:1';
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: var(--font-mono);
      z-index: 1;
    }
  }
`;

const AspectRatioContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
  
  > * {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  > img,
  > video,
  > iframe {
    object-fit: cover;
  }
`;

export { AspectRatio };

/**
 * A mobile device frame with a 19.5:9 aspect ratio
 */
export const MobileFrame = forwardRef<HTMLDivElement, Omit<AspectRatioProps, 'ratio' | 'device'>>((props, ref) => (
  <AspectRatio ref={ref} device="mobile" {...props} />
));

MobileFrame.displayName = 'MobileFrame';

/**
 * A tablet device frame with a 16:10 aspect ratio
 */
export const TabletFrame = forwardRef<HTMLDivElement, Omit<AspectRatioProps, 'ratio' | 'device'>>((props, ref) => (
  <AspectRatio ref={ref} device="tablet" {...props} />
));

TabletFrame.displayName = 'TabletFrame';

/**
 * A desktop frame with a 16:9 aspect ratio
 */
export const DesktopFrame = forwardRef<HTMLDivElement, Omit<AspectRatioProps, 'ratio' | 'device'>>((props, ref) => (
  <AspectRatio ref={ref} device="desktop" {...props} />
));

DesktopFrame.displayName = 'DesktopFrame';
