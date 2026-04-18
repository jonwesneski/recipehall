import { expect, test } from '../fixtures';

test('create a recipe', async ({ authedPage: page }) => {
  await page.goto('/recipes');

  // The Navbar shows the "Create Recipe" icon link on the /recipes list page
  await page.locator('a[href="/create-recipe"]').click();
  await expect(page).toHaveURL('/create-recipe');

  // Fill in the recipe name (input[name="recipe-name"] from BasicInfoInput)
  await page.locator('input[name="recipe-name"]').fill('E2E Test Recipe');

  // Fill step 1: two ingredients and a 3-word instruction
  const step = page.locator('[data-testid="step-row"]').first();

  const firstIngredient = step
    .locator('textarea[data-testid="ingredient-row"]')
    .first();
  await firstIngredient.click();
  await firstIngredient.pressSequentially('2 cups flour');
  await firstIngredient.press('Enter');

  const secondIngredient = step
    .locator('textarea[data-testid="ingredient-row"]')
    .nth(1);
  await secondIngredient.pressSequentially('1 teaspoons salt');

  await page.locator('textarea[name="instructions"]').fill('Mix it well');

  // Submit as a private recipe
  await page.getByRole('button', { name: /save private/i }).click();

  // On success the app navigates to the new recipe's detail page.
  // waitForURL (event-based) handles Next.js 15's deferred URL commit better
  // than the polling-based toHaveURL, and the RSC fetch for the detail page
  // can be slow on a cold testcontainer DB.
  await page.waitForURL(/\/recipes\/[a-z0-9-]+/, { timeout: 15000 });
});
