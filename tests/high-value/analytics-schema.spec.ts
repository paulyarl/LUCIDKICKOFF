import { test, expect } from '@playwright/test';

// Define the expected event schema
const EVENT_SCHEMA = {
  // Common properties for all events
  $schema: 'http://json-schema.org/draft-07/schema#',
  $defs: {
    baseProperties: {
      type: 'object',
      required: ['distinct_id', 'time', 'event'],
      properties: {
        distinct_id: { type: 'string' },
        time: { type: 'number' },
        event: { type: 'string' },
        $set: { type: 'object' },
        $set_once: { type: 'object' },
        $groups: { type: 'object' },
        $group_set: { type: 'object' },
        $group_set_once: { type: 'object' },
      },
    },
  },
  oneOf: [
    // Page view event
    {
      properties: {
        event: { const: '$pageview' },
        $current_url: { type: 'string' },
        $host: { type: 'string' },
        $pathname: { type: 'string' },
        $referrer: { type: ['string', 'null'] },
        $referring_domain: { type: ['string', 'null'] },
      },
      required: ['$current_url', '$host', '$pathname'],
    },
    // Artwork saved event
    {
      properties: {
        event: { const: 'artwork_saved' },
        artwork_id: { type: 'string' },
        layer_count: { type: 'number' },
        stroke_count: { type: 'number' },
        resolution: { type: 'string', enum: ['device', 'server'] },
        merged: { type: 'boolean' },
      },
      required: ['artwork_id', 'resolution'],
    },
    // Approval events
    {
      properties: {
        event: { enum: ['approval_requested', 'approval_decided'] },
        request_id: { type: 'string' },
        requester_id: { type: 'string' },
        decision: { type: 'string', enum: ['approved', 'rejected'] },
        timestamp: { type: 'number' },
      },
      required: ['request_id', 'requester_id'],
    },
  ],
};

// Helper function to validate event against schema
function validateEvent(event: any, schema: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Check required base properties
  const requiredBase = schema.$defs.baseProperties.required;
  for (const prop of requiredBase) {
    if (event[prop] === undefined) {
      errors.push(`Missing required property: ${prop}`);
    }
  }
  
  // Check event type specific schema
  const eventSchema = schema.oneOf.find((s: any) => 
    s.properties.event.const === event.event || 
    s.properties.event.enum?.includes(event.event)
  );
  
  if (!eventSchema) {
    errors.push(`No schema found for event: ${event.event}`);
    return { valid: false, errors };
  }
  
  // Check required properties
  const requiredProps = eventSchema.required || [];
  for (const prop of requiredProps) {
    if (event[prop] === undefined) {
      errors.push(`Missing required property for ${event.event}: ${prop}`);
    }
  }
  
  // Check property types
  for (const [prop, propSchema] of Object.entries(eventSchema.properties)) {
    if (event[prop] === undefined) continue;
    
    const value = event[prop];
    const schemaDef = propSchema as any;
    
    if (schemaDef.type) {
      const types = Array.isArray(schemaDef.type) ? schemaDef.type : [schemaDef.type];
      const typeMatches = types.some((type: string) => {
        if (type === 'null') return value === null;
        if (type === 'array') return Array.isArray(value);
        return typeof value === type || (type === 'integer' && Number.isInteger(value));
      });
      
      if (!typeMatches) {
        errors.push(`Invalid type for ${prop}: expected ${types.join(' or ')}, got ${typeof value}`);
      }
    }
    
    if (schemaDef.enum && !schemaDef.enum.includes(value)) {
      errors.push(`Invalid value for ${prop}: ${value}. Must be one of: ${schemaDef.enum.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

test.describe('Analytics Schema Validation', () => {
  test('should validate all PostHog events against schema', async ({ page }) => {
    // Intercept PostHog capture calls
    const capturedEvents: any[] = [];
    
    await page.route('**/e/**', async (route) => {
      const postData = route.request().postData();
      if (postData) {
        const events = JSON.parse(postData).batch || [JSON.parse(postData)];
        capturedEvents.push(...events);
      }
      await route.fulfill({ status: 200 });
    });
    
    // Navigate and perform actions that trigger events
    await page.goto('/');
    await page.click('button:has-text("Save")');
    
    // Wait for events to be captured
    await page.waitForTimeout(1000);
    
    // Validate each captured event
    const validationResults = capturedEvents.map(event => ({
      event: event.event,
      ...validateEvent(event, EVENT_SCHEMA),
    }));
    
    // Log validation errors
    const failedValidations = validationResults.filter(r => !r.valid);
    if (failedValidations.length > 0) {
      console.error('Analytics validation errors:', JSON.stringify(failedValidations, null, 2));
    }
    
    // Assert all events are valid
    expect(failedValidations).toHaveLength(0);
  });
  
  test('should detect invalid events', () => {
    const invalidEvent = {
      event: 'artwork_saved',
      distinct_id: 'user123',
      time: Date.now(),
      // Missing required artwork_id
      resolution: 'invalid', // Invalid enum value
    };
    
    const { valid, errors } = validateEvent(invalidEvent, EVENT_SCHEMA);
    expect(valid).toBe(false);
    expect(errors).toContain('Missing required property for artwork_saved: artwork_id');
    expect(errors).toContain('Invalid value for resolution: invalid. Must be one of: device, server');
  });
});
