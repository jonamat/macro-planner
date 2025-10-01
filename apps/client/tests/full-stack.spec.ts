import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

const waitForApiCall = (
  page: import('@playwright/test').Page,
  predicate: (response: import('@playwright/test').APIResponse) => boolean
) =>
  page.waitForResponse((response) => {
    try {
      return predicate(response);
    } catch {
      return false;
    }
  });

test.describe('Full stack integration using live server', () => {
  test('runs full user journey against dev environment', async ({ page }) => {
    const uniqueSuffix = randomUUID().slice(0, 8);
    const username = `it-${uniqueSuffix}`;
    const password = 'SuperSecret!123';
    const mealName = `Meal ${uniqueSuffix}`;
    const ingredientName = `Ingredient ${uniqueSuffix}`;

    // 1. Start from signup page (dev server started via playwright config)
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup$/);

    // 2. Sign up the user
    await page.getByPlaceholder('user').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/auth/signup') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Sign up' }).click()
    ]);

    // Wait for initial data fetch
    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/ingredients') && response.request().method() === 'GET'
      ),
      waitForApiCall(page, (response) =>
        response.url().includes('/api/meals') && response.request().method() === 'GET'
      )
    ]);
    await expect(page).toHaveURL('http://localhost:5173/');

    // 3. Logout and login again to cover both flows
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByPlaceholder('user').fill(username);
    await page.locator('input[type="password"]').fill(password);
    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/auth/login') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Login' }).click()
    ]);

    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/ingredients') && response.request().method() === 'GET'
      ),
      waitForApiCall(page, (response) =>
        response.url().includes('/api/meals') && response.request().method() === 'GET'
      )
    ]);
    await expect(page).toHaveURL('http://localhost:5173/');

    // 4. Add a meal
    await page.getByRole('button', { name: 'Add Meal' }).click();
    await expect(page.getByRole('heading', { name: 'Add meal' })).toBeVisible();

    await page.locator('#meal-name').fill(mealName);
    await page.locator('#meal-carbo').fill('10');
    await page.locator('#meal-protein').fill('10');
    await page.locator('#meal-fat').fill('10');

    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/meals') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Save' }).click()
    ]);
    await expect(page.getByRole('heading', { name: 'Add meal' })).not.toBeVisible();

    // 5. Add an ingredient
    await page.getByRole('button', { name: 'Add Ingredient' }).click();
    await expect(page.getByRole('heading', { name: 'Add ingredient' })).toBeVisible();

    await page.locator('#ingredient-name').fill(ingredientName);
    await page.locator('#ingredient-carbo').fill('10');
    await page.locator('#ingredient-protein').fill('10');
    await page.locator('#ingredient-fat').fill('10');
    await page.locator('#ingredient-max').fill('100');
    await page.locator('#ingredient-mandatory').fill('100');

    await Promise.all([
      waitForApiCall(page, (response) =>
        response.url().includes('/api/ingredients') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Save' }).click()
    ]);
    await expect(page.getByRole('heading', { name: 'Add ingredient' })).not.toBeVisible();

    // 6. Select the newly created ingredient and ensure constraints persist
    const ingredientCard = page
      .locator('[data-testid^="ingredient-card-"]')
      .filter({ hasText: ingredientName });

    await ingredientCard.locator('input[type="checkbox"]').check();

    // 7. Run the optimizer
    await page.getByRole('button', { name: 'Calculate' }).click();

    const modalHeading = page.getByRole('heading', { name: 'Optimization results' });
    await expect(modalHeading).toBeVisible();

    const ingredientRow = page.locator('tbody tr').filter({ hasText: ingredientName });
    await expect(ingredientRow.locator('td').nth(1)).toHaveText('100.00');

    const deviationRow = page.locator('tbody tr').filter({ hasText: 'Deviation (%)' });
    await expect(deviationRow.locator('td').nth(2)).toHaveText('0.00');
    await expect(deviationRow.locator('td').nth(3)).toHaveText('0.00');
    await expect(deviationRow.locator('td').nth(4)).toHaveText('0.00');
  });
});
