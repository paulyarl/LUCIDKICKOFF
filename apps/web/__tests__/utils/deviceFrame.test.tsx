import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeviceFrame, validateAspectRatio } from '@/components/ui/DeviceFrame';
import { aspectRatios } from '@/styles/design-tokens';

describe('DeviceFrame', () => {
  const testContent = <div data-testid="test-content">Test Content</div>;

  it('renders with mobile aspect ratio by default', () => {
    render(<DeviceFrame>{testContent}</DeviceFrame>);
    const frame = screen.getByTestId('test-content').closest('div[style*="padding-bottom"]');
    expect(frame).toBeInTheDocument();
    
    // Validate the aspect ratio is approximately 19.5:9 (mobile)
    validateAspectRatio(frame as HTMLElement, aspectRatios.mobile);
  });

  it('renders with tablet aspect ratio when specified', () => {
    render(<DeviceFrame variant="tablet">{testContent}</DeviceFrame>);
    const frame = screen.getByTestId('test-content').closest('div[style*="padding-bottom"]');
    validateAspectRatio(frame as HTMLElement, aspectRatios.tablet);
  });

  it('renders with custom aspect ratio when specified', () => {
    const customRatio = 4 / 3;
    render(
      <DeviceFrame variant="custom" aspectRatio={customRatio}>
        {testContent}
      </DeviceFrame>
    );
    const frame = screen.getByTestId('test-content').closest('div[style*="padding-bottom"]');
    validateAspectRatio(frame as HTMLElement, customRatio);
  });

  it('applies custom background color', () => {
    const bgColor = '#ff0000';
    render(
      <DeviceFrame backgroundColor={bgColor} data-testid="frame">
        {testContent}
      </DeviceFrame>
    );
    const frame = screen.getByTestId('frame');
    expect(frame).toHaveStyle(`background-color: ${bgColor}`);
  });

  it('validates aspect ratio with tolerance', () => {
    const element = document.createElement('div');
    Object.defineProperties(element, {
      getBoundingClientRect: {
        value: () => ({ width: 195, height: 90 }), // 19.5:9 ratio
      },
    });
    
    // Should not throw
    expect(() => validateAspectRatio(element, 19.5 / 9)).not.toThrow();
    
    // Should throw for incorrect ratio
    expect(() => validateAspectRatio(element, 16 / 9)).toThrow('Aspect ratio validation failed');
  });
});
