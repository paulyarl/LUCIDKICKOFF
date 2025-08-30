/**
 * Utility functions for handling aspect ratios
 */

type AspectRatio = '16/10' | '19.5/9';

/**
 * Validates if the given dimensions match the required aspect ratio
 * @param width - The width of the element
 * @param height - The height of the element
 * @param ratio - The required aspect ratio (e.g., '16/10' or '19.5/9')
 * @returns boolean - True if the dimensions match the required aspect ratio
 */
export function validateAspectRatio(
  width: number,
  height: number,
  ratio: AspectRatio
): boolean {
  if (width <= 0 || height <= 0) return false;
  
  const [w, h] = ratio.split('/').map(Number);
  const expectedRatio = w / h;
  const actualRatio = width / height;
  
  // Allow for small floating point imprecision
  return Math.abs(actualRatio - expectedRatio) < 0.01;
}

/**
 * Calculates the dimensions that maintain the required aspect ratio
 * @param width - The original width
 * @param height - The original height
 * @param ratio - The required aspect ratio (e.g., '16/10' or '19.5/9')
 * @returns { width: number, height: number } - The adjusted dimensions
 */
export function maintainAspectRatio(
  width: number,
  height: number,
  ratio: AspectRatio = '16/10'
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  
  const [w, h] = ratio.split('/').map(Number);
  const targetRatio = w / h;
  const currentRatio = width / height;
  
  if (currentRatio > targetRatio) {
    // Current is wider than target, adjust width
    return { width: height * targetRatio, height };
  } else {
    // Current is taller than target, adjust height
    return { width, height: width / targetRatio };
  }
}

/**
 * Generates CSS classes for maintaining aspect ratio
 * @param ratio - The required aspect ratio (e.g., '16/10' or '19.5/9')
 * @returns string - Tailwind CSS classes for the aspect ratio
 */
export function getAspectRatioClasses(ratio: AspectRatio = '16/10'): string {
  const classes = {
    '16/10': 'aspect-[16/10]',
    '19.5/9': 'aspect-[19.5/9]',
  };
  
  return classes[ratio] || 'aspect-[16/10]';
}

/**
 * Calculates the maximum dimensions that fit within a container while maintaining aspect ratio
 * @param containerWidth - The width of the container
 * @param containerHeight - The height of the container
 * @param ratio - The required aspect ratio (e.g., '16/10' or '19.5/9')
 * @returns { width: number, height: number } - The maximum dimensions that fit
 */
export function getMaxDimensions(
  containerWidth: number,
  containerHeight: number,
  ratio: AspectRatio = '16/10'
): { width: number; height: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 0, height: 0 };
  }
  
  const [w, h] = ratio.split('/').map(Number);
  const targetRatio = w / h;
  const containerRatio = containerWidth / containerHeight;
  
  if (containerRatio > targetRatio) {
    // Container is wider than target, height is the limiting factor
    return {
      width: containerHeight * targetRatio,
      height: containerHeight
    };
  } else {
    // Container is taller than target, width is the limiting factor
    return {
      width: containerWidth,
      height: containerWidth / targetRatio
    };
  }
}

/**
 * Calculates the dimensions for a cover image with optional max constraints
 * @param originalWidth - The original width of the image
 * @param originalHeight - The original height of the image
 * @param ratio - The required aspect ratio (e.g., '16/10' or '19.5/9')
 * @param maxWidth - Optional maximum width
 * @param maxHeight - Optional maximum height
 * @returns { width: number, height: number } - The calculated dimensions
 */
export function calculateCoverDimensions(
  originalWidth: number,
  originalHeight: number,
  ratio: AspectRatio = '16/10',
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  // First maintain the required aspect ratio
  let { width, height } = maintainAspectRatio(originalWidth, originalHeight, ratio);
  
  // Then apply max constraints if provided
  if (maxWidth !== undefined && width > maxWidth) {
    const scale = maxWidth / width;
    width = maxWidth;
    height = height * scale;
  }
  
  if (maxHeight !== undefined && height > maxHeight) {
    const scale = maxHeight / height;
    height = maxHeight;
    width = width * scale;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}
