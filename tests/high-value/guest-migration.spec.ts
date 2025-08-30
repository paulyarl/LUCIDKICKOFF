import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('Guest to Magic-link Migration', () => {
  let supabase: any;
  let guestArtworkId: string;
  
  test.beforeAll(async () => {
    // Initialize Supabase
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Create guest test data
    const { data: guestData } = await supabase.auth.signInWithPassword({
      email: 'guest@example.com',
      password: 'guest123',
    });
    
    // Store guest artwork ID for verification
    const { data: artwork } = await supabase
      .from('artworks')
      .select('id')
      .eq('user_id', guestData.user?.id)
      .single();
      
    guestArtworkId = artwork.id;
    
    // Sign out
    await supabase.auth.signOut();
  });

  test('should migrate guest data to authenticated user', async ({ page }) => {
    // Start as guest
    await page.goto('/');
    
    // Verify guest data exists
    await page.goto('/library');
    await expect(page.getByText('Guest Artwork')).toBeVisible();
    
    // Initiate magic link sign in
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByLabel('Email').fill('parent@example.com');
    await page.getByRole('button', { name: 'Send Magic Link' }).click();
    
    // Simulate magic link click (in real test, this would be handled by test email server)
    const magicLink = await page.evaluate(async () => {
      return await fetch('/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email: 'parent@example.com' }),
      })
      .then(res => res.json())
      .then(data => data.magicLink);
    });
    
    // Complete sign in
    await page.goto(magicLink);
    await page.waitForURL('/library');
    
    // Verify data was migrated
    await expect(page.getByText('Guest Artwork')).toBeVisible();
    
    // Verify database records were updated
    const { data: userData } = await supabase.auth.getUser();
    const { data: migratedArtwork } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', guestArtworkId)
      .single();
      
    expect(migratedArtwork.user_id).toBe(userData.user?.id);
    
    // Verify no duplicates
    const { count } = await supabase
      .from('artworks')
      .select('*', { count: 'exact', head: true })
      .eq('title', 'Guest Artwork');
      
    expect(count).toBe(1);
  });
});
