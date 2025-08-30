import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { aspectRatios } from '@/styles/design-tokens';

interface DeviceFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of device frame to render
   * @default 'mobile'
   */
  variant?: 'mobile' | 'tablet' | 'desktop' | 'custom';
  /**
   * Custom aspect ratio (width / height)
   * Only used when variant is 'custom'
   */
  aspectRatio?: number;
  /**
   * Background color of the frame
   * @default 'var(--color-background)'
   */
  backgroundColor?: string;
  /**
   * Border color of the frame
   * @default 'var(--color-border)'
   */
  borderColor?: string;
  /**
   * Border radius of the frame
   * @default 'var(--radius-lg)'
   */
  borderRadius?: string;
  /**
   * Whether to show the device frame
   * @default true
   */
  showFrame?: boolean;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Children to render inside the device frame
   */
  children: React.ReactNode;
}

const DeviceFrame = forwardRef<HTMLDivElement, DeviceFrameProps>(({
  variant = 'mobile',
  aspectRatio,
  backgroundColor = 'var(--color-background)',
  borderColor = 'var(--color-border)',
  borderRadius = 'var(--radius-lg)',
  showFrame = true,
  className,
  children,
  ...props
}, ref) => {
  const getAspectRatio = () => {
    if (variant === 'custom' && aspectRatio) {
      return aspectRatio;
    }
    return aspectRatios[variant === 'mobile' ? 'mobile' : variant === 'tablet' ? 'tablet' : 'desktop'];
  };

  const ratio = getAspectRatio();
  const paddingBottom = `${(1 / ratio) * 100}%`;

  return (
    <FrameContainer 
      ref={ref}
      className={className}
      $aspectRatio={ratio}
      $showFrame={showFrame}
      $borderColor={borderColor}
      $borderRadius={borderRadius}
      $backgroundColor={backgroundColor}
      {...props}
    >
      <FrameContent>{children}</FrameContent>
      {showFrame && (
        <FrameOverlay 
          aria-hidden="true"
          $borderRadius={borderRadius}
        />
      )}
    </FrameContainer>
  );
});

DeviceFrame.displayName = 'DeviceFrame';

export { DeviceFrame };

// Styled components
const FrameContainer = styled.div<{
  $aspectRatio: number;
  $showFrame: boolean;
  $borderColor: string;
  $borderRadius: string;
  $backgroundColor: string;
}>`
  position: relative;
  width: 100%;
  max-width: 100%;
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  border-radius: ${({ $borderRadius }) => $borderRadius};
  overflow: hidden;
  box-shadow: ${({ $showFrame, theme }) => 
    $showFrame ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none'};
  
  /* Enforce aspect ratio */
  &::before {
    content: '';
    display: block;
    padding-bottom: ${({ $aspectRatio }) => (1 / $aspectRatio) * 100}%;
  }
`;

const FrameContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const FrameOverlay = styled.div<{ $borderRadius: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 12px solid var(--color-background);
  border-radius: ${({ $borderRadius }) => $borderRadius};
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  
  /* Notch for mobile */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40%;
    height: 20px;
    background-color: var(--color-background);
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
`;

// Utility component to validate aspect ratio in tests
export function validateAspectRatio(
  element: HTMLElement,
  expectedRatio: number,
  tolerance = 0.01
) {
  const rect = element.getBoundingClientRect();
  const actualRatio = rect.width / rect.height;
  const ratioDifference = Math.abs(actualRatio - expectedRatio);
  
  if (ratioDifference > tolerance) {
    throw new Error(
      `Aspect ratio validation failed. Expected ~${expectedRatio.toFixed(2)}:1, got ${actualRatio.toFixed(2)}:1`
    );
  }
  
  return true;
}
