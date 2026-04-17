import { expect, test } from '../fixtures';

test('create a recipe', async ({ authedPage: page }) => {
  await page.goto('/recipes');

  // The Navbar shows the "Create Recipe" icon link on the /recipes list page
  await page.locator('a[href="/create-recipe"]').click();
  await expect(page).toHaveURL('/create-recipe');

  // Fill in the recipe name (input[name="recipe-name"] from BasicInfoInput)
  await page.locator('input[name="recipe-name"]').fill('E2E Test Recipe');

  // Submit as a private recipe
  await page.getByRole('button', { name: /save private/i }).click();

  // On success the app navigates to the new recipe's detail page
  await expect(page).toHaveURL(/\/recipes\/[a-z0-9-]+/);
});
