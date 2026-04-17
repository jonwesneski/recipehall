import { expect, test } from '../fixtures';

test('authenticated user can access the recipes page', async ({ authedPage: page }) => {
  await page.goto('/recipes');
  await expect(page).toHaveURL(/\/recipes/);
  // The middleware would redirect unauthenticated users away; reaching this URL confirms auth works
});
