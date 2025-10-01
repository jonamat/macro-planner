import { test, expect } from '@playwright/test';

test.describe('Calculation warnings', () => {
  test('shows toast when calculation is infeasible', async ({ page }) => {
    const meals = [
      {
        id: 'meal-1',
        name: 'Impossible Meal',
        carbo: 50,
        protein: 30,
        fat: 20
      }
    ];

    const ingredients = [
      {
        id: 'ing-impossible',
        name: 'Protein Only',
        carbo100g: 0,
        protein100g: 100,
        fat100g: 0,
        min: 0,
        max: 100,
        mandatory: 0,
        indivisible: null,
        sequence: 0
      }
    ];

    await page.addInitScript((token: string, user: { id: string; username: string }) => {
      localStorage.setItem('macro-calculator-token', token);
      localStorage.setItem('macro-calculator-user', JSON.stringify(user));
    }, 'test-token', { id: 'user-1', username: 'tester' });

    await page.route('**/api/ingredients', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: ingredients })
        });
        return;
      }

      route.fallback();
    });

    await page.route('**/api/meals', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: meals })
        });
        return;
      }

      route.fallback();
    });

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/ingredients') && response.request().method() === 'GET'
      ),
      page.waitForResponse((response) =>
        response.url().includes('/api/meals') && response.request().method() === 'GET'
      ),
      page.goto('/')
    ]);

    const calculateButton = page.getByRole('button', { name: 'Calculate' });
    await expect(calculateButton).toBeDisabled();

    await page.getByRole('checkbox', { name: 'Include Protein Only' }).check();

    await expect(calculateButton).toBeEnabled();

    await calculateButton.click();

    const toastLocator = page.locator('.Toastify__toast--warning');
    await expect(toastLocator).toBeVisible({ timeout: 10000 });
    await expect(toastLocator).toContainText(/Unable to meet macros/i);
  });
});
