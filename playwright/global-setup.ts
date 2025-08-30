import { FullConfig, request } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const TEST_USERS = {
  guest: {
    email: 'guest@example.com',
    password: 'guest123',
    storageState: 'playwright/.auth/guest.json',
  },
  parent: {
    email: 'parent@example.com',
    password: 'parent123',
    storageState: 'playwright/.auth/parent.json',
  },
  child: {
    email: 'child@example.com',
    password: 'child123',
    storageState: 'playwright/.auth/child.json',
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    storageState: 'playwright/.auth/admin.json',
  },
};

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const baseApiUrl = `${baseURL}/api`;
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Create test users and get auth tokens
  for (const [role, user] of Object.entries(TEST_USERS)) {
    // Clean up existing user
    await supabase.auth.admin.deleteUser(user.email);
    
    // Create user
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role },
    });
    
    if (error) {
      console.error(`Error creating ${role} user:`, error);
      continue;
    }
    
    // Get session
    const { data: sessionData } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    
    // Store auth state
    const authFile = path.join(process.cwd(), user.storageState);
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(
      authFile,
      JSON.stringify({
        cookies: [],
        origins: [
          {
            origin: baseURL,
            localStorage: [
              {
                name: 'sb-access-token',
                value: sessionData.session?.access_token || '',
              },
              {
                name: 'sb-refresh-token',
                value: sessionData.session?.refresh_token || '',
              },
            ],
          },
        ],
      })
    );
    
    // Create test data for each user
    if (role === 'guest') {
      await createGuestData(supabase, authData.user.id);
    }
  }
}

async function createGuestData(supabase: any, userId: string) {
  // Create sample artwork
  const { data: artwork } = await supabase
    .from('artworks')
    .insert({
      user_id: userId,
      title: 'Guest Artwork',
      data: { layers: [] },
      is_public: false,
    })
    .select()
    .single();
    
  // Create sample favorites
  await supabase
    .from('favorites')
    .insert([
      { user_id: userId, item_id: 'item1', item_type: 'template' },
      { user_id: userId, item_id: 'item2', item_type: 'brush' },
    ]);
    
  // Create sample user packs
  await supabase
    .from('user_packs')
    .insert({
      user_id: userId,
      name: 'Guest Pack',
      items: ['item1', 'item2'],
      is_public: false,
    });
    
  return { artwork };
}

export default globalSetup;
