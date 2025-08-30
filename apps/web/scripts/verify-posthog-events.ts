import { PostHog } from 'posthog-node';
import { z } from 'zod';

// Initialize PostHog client
const posthog = new PostHog(process.env.POSTHOG_API_KEY || '', {
  host: 'https://app.posthog.com',
});

// Define your event schemas
const eventSchemas = {
  // User events
  'user_signed_up': z.object({
    user_id: z.string().uuid(),
    email: z.string().email(),
    signup_method: z.enum(['email', 'google', 'apple']),
  }),
  
  'user_logged_in': z.object({
    user_id: z.string().uuid(),
    method: z.enum(['password', 'magic_link', 'social']),
  }),

  // Artwork events
  'artwork_created': z.object({
    user_id: z.string().uuid(),
    artwork_id: z.string().uuid(),
    pack_id: z.string().uuid().optional(),
    page_id: z.string().uuid().optional(),
    is_public: z.boolean(),
  }),

  'artwork_shared': z.object({
    user_id: z.string().uuid(),
    artwork_id: z.string().uuid(),
    share_method: z.enum(['link', 'social', 'email']),
  }),

  // Pack events
  'pack_created': z.object({
    user_id: z.string().uuid(),
    pack_id: z.string().uuid(),
    is_public: z.boolean(),
  }),

  'pack_shared': z.object({
    user_id: z.string().uuid(),
    pack_id: z.string().uuid(),
    share_method: z.enum(['link', 'social', 'email']),
  }),

  // Parent/Child events
  'parental_approval_requested': z.object({
    child_id: z.string().uuid(),
    parent_id: z.string().uuid(),
    content_type: z.enum(['artwork', 'pack']),
    content_id: z.string().uuid(),
  }),

  'parental_approval_decision': z.object({
    parent_id: z.string().uuid(),
    child_id: z.string().uuid(),
    content_type: z.enum(['artwork', 'pack']),
    content_id: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().optional(),
  }),
};

type EventName = keyof typeof eventSchemas;

async function verifyEventSchemas() {
  console.log('Verifying PostHog event schemas...');
  
  // Get all event names from PostHog
  const events = await posthog.api.get('/api/event_definitions', {
    search: '',
    limit: 100,
  });

  const results: { [key: string]: { valid: boolean; error?: string } } = {};
  
  // Verify each event schema
  for (const [eventName, schema] of Object.entries(eventSchemas)) {
    try {
      // Get sample events from PostHog
      const samples = await posthog.api.get(`/api/projects/${process.env.POSTHOG_PROJECT_ID}/events`, {
        event: eventName,
        limit: 10,
      });

      if (samples.results.length === 0) {
        results[eventName] = { valid: false, error: 'No sample events found' };
        continue;
      }

      // Validate each sample event
      for (const event of samples.results) {
        const properties = event.properties || {};
        const result = schema.safeParse(properties);
        
        if (!result.success) {
          results[eventName] = { 
            valid: false, 
            error: `Invalid schema: ${result.error.message}` 
          };
          break;
        }
      }
      
      if (!results[eventName]) {
        results[eventName] = { valid: true };
      }
    } catch (error) {
      results[eventName] = { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Print results
  let hasErrors = false;
  console.log('\nEvent Schema Validation Results:');
  console.log('='.repeat(50));
  
  for (const [eventName, result] of Object.entries(results)) {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${eventName}`);
    
    if (!result.valid) {
      console.log(`   Error: ${result.error}`);
      hasErrors = true;
    }
  }
  
  console.log('='.repeat(50));
  
  if (hasErrors) {
    console.error('\n❌ Some event schemas are invalid');
    process.exit(1);
  } else {
    console.log('\n✅ All event schemas are valid');
    process.exit(0);
  }
}

// Run the verification
verifyEventSchemas()
  .catch(error => {
    console.error('Error verifying event schemas:', error);
    process.exit(1);
  });
