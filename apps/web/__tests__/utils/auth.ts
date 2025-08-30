import { Page } from '@playwright/test';
import { supabase } from '@/lib/supabase/client';

type UserCredentials = {
  email: string;
  password: string;
  username: string;
};

export async function createTestUser(user: UserCredentials) {
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', user.username)
    .single();

  if (!existingUser) {
    // In a real test environment, you would use a test API endpoint
    // to create users rather than direct database access
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          username: user.username,
          full_name: user.username,
        },
      },
    });

    if (error) {
      console.error('Error creating test user:', error);
    }
  }
}

export async function loginAsUser(page: Page, user: Omit<UserCredentials, 'username'>) {
  await page.goto('/login');
  
  // Fill in the login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/dashboard');
  
  // Wait for any auth state changes to complete
  await page.waitForTimeout(1000);
}

export async function logoutUser(page: Page) {
  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Navigate to logout if on a page that has the logout button
  if (page.url().includes('/dashboard')) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('**/login');
  }
}

export async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function deleteTestUser(email: string) {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email,
    password: 'Test123!', // Default password for test users
  });
  
  if (user) {
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
  }
}
