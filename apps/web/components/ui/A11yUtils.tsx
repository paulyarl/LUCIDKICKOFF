import React from 'react';

/**
 * Type for ARIA attributes that can be passed to components
 */
type A11yProps = {
  /**
   * A label that describes the interactive element
   */
  'aria-label'?: string;
  /**
   * Identifies the element that labels the current element
   */
  'aria-labelledby'?: string;
  /**
   * A description of the element
   */
  'aria-describedby'?: string;
  /**
   * The current value of the component
   */
  'aria-valuenow'?: number;
  /**
   * The minimum value of the component
   */
  'aria-valuemin'?: number;
  /**
   * The maximum value of the component
   */
  'aria-valuemax'?: number;
  /**
   * The current state of the component
   */
  'aria-expanded'?: boolean | 'true' | 'false' | undefined;
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed' | undefined;
  'aria-selected'?: boolean | 'true' | 'false' | undefined;
  'aria-hidden'?: boolean | 'true' | 'false' | undefined;
  'aria-disabled'?: boolean | 'true' | 'false' | undefined;
  'aria-checked'?: boolean | 'true' | 'false' | 'mixed' | undefined;
  /**
   * The role of the element
   */
  role?: string;
  /**
   * The tab index of the element
   */
  tabIndex?: number;
};

/**
 * Type for image attributes that require alt text
 */
type ImageA11yProps = {
  /**
   * Alternative text for the image
   */
  alt: string;
  /**
   * Whether the image is decorative
   */
  'aria-hidden'?: boolean;
};

/**
 * Validates that an image has proper alt text
 * @param props - The props of the image component
 * @param componentName - The name of the component for error messages
 */
function validateImageProps(
  props: ImageA11yProps,
  componentName: string = 'Image'
): void {
  if (process.env.NODE_ENV === 'production') return;

  const { alt, 'aria-hidden': ariaHidden } = props;

  // If the image is not decorative, it must have alt text
  if (ariaHidden !== true && (!alt || typeof alt !== 'string' || alt.trim() === '')) {
    console.error(
      `[${componentName}] Missing required alt text for non-decorative image. ` +
      'Add an alt text or set aria-hidden="true" if the image is decorative.'
    );
  }

  // If the image is decorative, it should have an empty alt and aria-hidden
  if (ariaHidden === true && alt && alt.trim() !== '') {
    console.warn(
      `[${componentName}] Image has both alt text and aria-hidden="true". ` +
      'If the image is decorative, remove the alt text. ' +
      'If the image is not decorative, remove aria-hidden.'
    );
  }
}

/**
 * Validates that an interactive element has proper ARIA attributes
 * @param props - The props of the component
 * @param componentName - The name of the component for error messages
 */
function validateAriaProps(
  props: A11yProps & { children?: React.ReactNode },
  componentName: string = 'Component'
): void {
  if (process.env.NODE_ENV === 'production') return;

  const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, role } = props;
  const hasLabel = !!(ariaLabel || ariaLabelledby);
  const hasContent = React.Children.count(props.children) > 0;

  // If the element has a role that requires a label
  if (role && !hasLabel && !hasContent) {
    console.error(
      `[${componentName}] Elements with the role "${role}" must have a label. ` +
      'Add an aria-label or aria-labelledby attribute, or provide text content.'
    );
  }

  // If the element has both aria-label and aria-labelledby
  if (ariaLabel && ariaLabelledby) {
    console.warn(
      `[${componentName}] Both aria-label and aria-labelledby are present. ` +
      'aria-labelledby will take precedence.'
    );
  }
}

/**
 * Validates that an interactive element has a minimum touch target size
 * @param element - The element to check
 * @param componentName - The name of the component for error messages
 */
function validateTouchTarget(
  element: HTMLElement | null,
  componentName: string = 'Component'
): void {
  if (process.env.NODE_ENV === 'production' || !element) return;

  const MIN_TOUCH_SIZE = 44; // Minimum touch target size in pixels
  const rect = element.getBoundingClientRect();
  const isTooSmall = rect.width < MIN_TOUCH_SIZE || rect.height < MIN_TOUCH_SIZE;

  if (isTooSmall) {
    console.warn(
      `[${componentName}] Interactive elements should have a minimum touch target size of ${MIN_TOUCH_SIZE}x${MIN_TOUCH_SIZE}px. ` +
      `Current size: ${Math.round(rect.width)}x${Math.round(rect.height)}px.`
    );
  }
}

/**
 * A higher-order component that adds ARIA validation to a component
 * @param WrappedComponent - The component to wrap
 */
function withA11yValidation<P extends A11yProps>(
  WrappedComponent: React.ComponentType<P>
) {
  return class WithA11yValidation extends React.Component<P> {
    private elementRef = React.createRef<HTMLElement>();

    componentDidMount() {
      if (this.elementRef.current) {
        validateTouchTarget(this.elementRef.current, WrappedComponent.name);
      }
      validateAriaProps(this.props, WrappedComponent.name);
    }

    render() {
      return <WrappedComponent ref={this.elementRef} {...this.props} />;
    }
  };
}

export {
  A11yProps,
  ImageA11yProps,
  validateImageProps,
  validateAriaProps,
  validateTouchTarget,
  withA11yValidation,
};
