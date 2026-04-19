import { defineConfig, devices } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const UI_BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Fail fast in CI; allow retries locally
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: UI_BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    // Auth setup runs first and saves storageState to .auth/user.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // All other tests run in a browser context pre-loaded with auth cookies
    {
      name: 'e2e',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      // DATABASE_URL from .env.e2e points to the fixed-port testcontainer (15432).
      // globalSetup binds the container to that port so the URL is static.
      command: 'PORT=3001 pnpm --filter api start:e2e',
      // Use /status (simple 200) not /health (runs DB check → 503 if DB isn't ready yet)
      url: `${API_BASE_URL}/status`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'PORT=3000 pnpm --filter ui dev',
      url: UI_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
