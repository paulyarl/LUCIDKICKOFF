import { FullConfig, chromium } from '@playwright/test';
import { createTestUser, deleteTestUser } from './utils/auth';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  
  // Create test users
  await createTestUser({
    email: 'test@example.com',
    password: 'Test123!',
    username: 'testuser',
  });
  
  await createTestUser({
    email: 'parent@example.com',
    password: 'Parent123!',
    username: 'parentuser',
  });
  
  await browser.close();
}

// Clean up test users after all tests
async function globalTeardown() {
  try {
    await deleteTestUser('test@example.com');
    await deleteTestUser('parent@example.com');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
}

export default globalSetup;

// Make sure to clean up after tests
process.on('exit', globalTeardown);
process.on('SIGINT', () => {
  globalTeardown().then(() => process.exit(1));
});
