/**
 * ESLint plugin for accessibility rules
 */

const ELEMENT_TYPE = {
  // Interactive elements that should have a minimum touch target size
  INTERACTIVE: [
    'a', 'button', 'input', 'select', 'textarea', 'label',
    '[role="button"]', '[role="link"]', '[role="menuitem"]',
    '[role="tab"]', '[role="checkbox"]', '[role="radio"]',
    '[role="switch"]', '[tabindex]'
  ],
  // Elements that should have alt text
  IMAGE: ['img', 'Image', 'svg[role="img"]'],
  // Elements that should have ARIA labels
  LABELABLE: [
    'button', 'input', 'meter', 'output', 'progress', 'select', 'textarea',
    'iframe', 'img', 'area', 'video', 'audio', 'object', '[role="button"]',
    '[role="textbox"]', '[role="combobox"]', '[role="searchbox"]',
    '[role="slider"]', '[role="spinbutton"]', '[role="tree"]',
    '[role="grid"]', '[role="listbox"]', '[role="menu"]', '[role="menubar"]',
    '[role="radiogroup"]', '[role="tablist"]', '[role="treegrid"]'
  ]
};

const MIN_TOUCH_SIZE = 44; // Minimum touch target size in pixels

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce accessibility best practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      minTouchSize: 'Interactive elements must have a minimum touch target size of 44x44px',
      missingAltText: 'Images must have alt text or an empty alt attribute for decorative images',
      missingAriaLabel: 'Interactive elements must have an accessible name (aria-label, aria-labelledby, or text content)',
      invalidAspectRatio: 'Device frames must maintain correct aspect ratios (mobile: 19.5:9, tablet: 16:10, desktop: 16:9)',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const elementName = node.name.name || '';
        const attributes = node.attributes || [];
        
        // Check for interactive elements
        if (isInteractiveElement(elementName, attributes)) {
          // Check touch target size
          const hasMinSize = hasMinimumTouchSize(attributes);
          if (!hasMinSize) {
            context.report({
              node,
              messageId: 'minTouchSize',
            });
          }
          
          // Check for accessible name
          if (!hasAccessibleName(elementName, attributes)) {
            context.report({
              node,
              messageId: 'missingAriaLabel',
            });
          }
        }
        
        // Check for images with missing alt text
        if (isImageElement(elementName) && !hasAltText(attributes)) {
          context.report({
            node,
            messageId: 'missingAltText',
          });
        }
        
        // Check device frame aspect ratios
        if (elementName === 'DeviceFrame') {
          const aspectRatio = getAspectRatio(attributes);
          if (aspectRatio && !isValidAspectRatio(aspectRatio)) {
            context.report({
              node,
              messageId: 'invalidAspectRatio',
            });
          }
        }
      },
    };
  },
};

// Helper functions
function isInteractiveElement(elementName, attributes) {
  const role = getAttributeValue(attributes, 'role');
  const tabIndex = getAttributeValue(attributes, 'tabIndex');
  const isInteractiveByRole = ELEMENT_TYPE.INTERACTIVE.some(selector => 
    selector === `[role="${role}"]` || 
    (role && selector === `[role="${role}"]`)
  );
  
  const isInteractiveByTag = ELEMENT_TYPE.INTERACTIVE.includes(elementName.toLowerCase());
  const isInteractiveByTabIndex = tabIndex !== null && tabIndex !== undefined;
  
  return isInteractiveByTag || isInteractiveByRole || isInteractiveByTabIndex;
}

function isImageElement(elementName) {
  return ELEMENT_TYPE.IMAGE.includes(elementName);
}

function hasMinimumTouchSize(attributes) {
  const width = getStyleValue(attributes, 'width') || getAttributeValue(attributes, 'width');
  const height = getStyleValue(attributes, 'height') || getAttributeValue(attributes, 'height');
  const minWidth = getStyleValue(attributes, 'minWidth') || getAttributeValue(attributes, 'minWidth');
  const minHeight = getStyleValue(attributes, 'minHeight') || getAttributeValue(attributes, 'minHeight');
  
  const hasMinWidth = parseFloat(minWidth || width || '0') >= MIN_TOUCH_SIZE;
  const hasMinHeight = parseFloat(minHeight || height || '0') >= MIN_TOUCH_SIZE;
  
  return hasMinWidth && hasMinHeight;
}

function hasAccessibleName(elementName, attributes) {
  // Skip hidden elements
  if (getAttributeValue(attributes, 'aria-hidden') === 'true') {
    return true;
  }
  
  // Check for explicit labels
  const hasLabel = [
    getAttributeValue(attributes, 'aria-label'),
    getAttributeValue(attributes, 'aria-labelledby'),
    getAttributeValue(attributes, 'title'),
  ].some(Boolean);
  
  if (hasLabel) return true;
  
  // Check for text content (simplified)
  // In a real implementation, you'd need to check the actual text content
  const hasChildren = attributes.some(attr => 
    attr.type === 'JSXSpreadAttribute' || 
    (attr.type === 'JSXAttribute' && attr.name.name === 'children')
  );
  
  // For form elements, check for associated label
  if (['input', 'select', 'textarea'].includes(elementName.toLowerCase())) {
    const id = getAttributeValue(attributes, 'id');
    if (id) {
      // In a real implementation, you'd check for a matching label with htmlFor
      return true; // Simplified for this example
    }
  }
  
  return hasChildren; // Assume children might contain text
}

function hasAltText(attributes) {
  const alt = getAttributeValue(attributes, 'alt');
  // Empty string is valid for decorative images
  return alt !== undefined && alt !== null;
}

function getAspectRatio(attributes) {
  return getAttributeValue(attributes, 'aspectRatio');
}

function isValidAspectRatio(ratio) {
  if (typeof ratio !== 'number') return false;
  
  const validRatios = [
    19.5 / 9,  // Mobile
    16 / 10,   // Tablet
    16 / 9,    // Desktop
  ];
  
  return validRatios.some(validRatio => 
    Math.abs(ratio - validRatio) < 0.1
  );
}

function getAttributeValue(attributes, name) {
  const attr = attributes.find(attr => 
    attr.type === 'JSXAttribute' && attr.name.name === name
  );
  
  if (!attr || !attr.value) return null;
  
  if (attr.value.type === 'StringLiteral') {
    return attr.value.value;
  }
  
  if (attr.value.type === 'JSXExpressionContainer' && 
      attr.value.expression.type === 'Literal') {
    return attr.value.expression.value;
  }
  
  return null;
}

function getStyleValue(attributes, property) {
  const styleAttr = attributes.find(attr => 
    attr.type === 'JSXAttribute' && 
    attr.name.name === 'style' &&
    attr.value &&
    attr.value.type === 'JSXExpressionContainer' &&
    attr.value.expression.type === 'ObjectExpression'
  );
  
  if (!styleAttr) return null;
  
  const styleProp = styleAttr.value.expression.properties.find(
    prop => prop.key && prop.key.name === property
  );
  
  if (!styleProp || !styleProp.value) return null;
  
  if (styleProp.value.type === 'Literal') {
    return styleProp.value.value;
  }
  
  if (styleProp.value.type === 'TemplateLiteral' && 
      styleProp.value.quasis.length === 1) {
    return styleProp.value.quasis[0].value.raw;
  }
  
  return null;
}
