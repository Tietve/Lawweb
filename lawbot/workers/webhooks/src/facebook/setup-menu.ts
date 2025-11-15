/**
 * Setup Facebook Messenger Persistent Menu
 * Run this script once to configure the Messenger menu
 *
 * Usage:
 * 1. Set MESSENGER_PAGE_ACCESS_TOKEN environment variable
 * 2. Run: npx tsx src/facebook/setup-menu.ts
 */

import { setupMessengerProfile } from './menu';

async function main() {
  const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

  if (!pageAccessToken) {
    console.error('Error: MESSENGER_PAGE_ACCESS_TOKEN environment variable is required');
    console.error('Usage: MESSENGER_PAGE_ACCESS_TOKEN=your_token npx tsx src/facebook/setup-menu.ts');
    process.exit(1);
  }

  console.log('Setting up Facebook Messenger profile...');

  try {
    await setupMessengerProfile(pageAccessToken);
    console.log('✅ Facebook Messenger profile setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up Messenger profile:', error);
    process.exit(1);
  }
}

main();
