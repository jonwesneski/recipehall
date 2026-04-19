import { type BrowserContext, type Page, test as base } from '@playwright/test';

type AuthFixtures = {
  authedPage: Page;
  authedContext: BrowserContext;
};

export const test = base.extend<AuthFixtures>({
  authedContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: '.auth/user.json',
    });
    await use(context);
    await context.close();
  },

  authedPage: async ({ authedContext }, use) => {
    const page = await authedContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
