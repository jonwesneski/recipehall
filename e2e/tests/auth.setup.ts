import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { E2E_USER } from '../helpers/db';

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

setup('authenticate as e2e user', async ({ browser }) => {
  // Create a fresh browser context with no prior state
  const context = await browser.newContext();

  // Call the test-only login endpoint to get JWT tokens
  const res = await context.request.post(`${API_BASE_URL}/auth/e2e-login`, {
    data: { email: E2E_USER.email, name: E2E_USER.name },
  });

  if (!res.ok()) {
    throw new Error(
      `e2e-login failed: ${res.status()} — is the API running with E2E_TESTING=true?`,
    );
  }

  const { accessToken } = (await res.json()) as { accessToken: string };

  // Set the auth cookies on the browser context.
  // The UI's getAccessToken() reads either 'access_token' or 'temp_access_token'
  // from server-side cookies. We set 'temp_access_token' (same name the real
  // /api/redirect route uses) so no UI code changes are needed.
  // Using secure: false because tests run over plain HTTP on localhost.
  await context.addCookies([
    {
      name: 'temp_access_token',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
    {
      name: 'access_token',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);

  // Ensure the .auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await context.storageState({ path: AUTH_FILE });
  await context.close();
});
