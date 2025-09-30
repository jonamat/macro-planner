import { test, expect } from '@playwright/test';

test.describe('Ingredient selection', () => {
  test('calculates macros with selected ingredients that report zero max bounds', async ({ page }) => {
    const ingredients = [
      {
        id: 'ing-1',
        name: 'Lean Chicken',
        carbo100g: 0,
        protein100g: 31,
        fat100g: 3,
        min: 0,
        max: 0,
        mandatory: 0,
        indivisible: null,
        sequence: 0
      },
      {
        id: 'ing-2',
        name: 'White Rice',
        carbo100g: 79,
        protein100g: 7,
        fat100g: 1,
        min: 0,
        max: 0,
        mandatory: 0,
        indivisible: null,
        sequence: 1
      },
      {
        id: 'ing-3',
        name: 'Olive Oil',
        carbo100g: 0,
        protein100g: 0,
        fat100g: 100,
        min: 0,
        max: 0,
        mandatory: 0,
        indivisible: null,
        sequence: 2
      }
    ];

    const meals = [
      {
        id: 'meal-1',
        name: 'Test Meal',
        carbo: 70,
        protein: 45,
        fat: 20
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

    await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();

    const calculateButton = page.getByRole('button', { name: 'Calculate' });
    await expect(calculateButton).toBeDisabled();

    const quickSearch = page.getByTestId('ingredient-quick-search');

    await quickSearch.fill('rice');
    const riceOption = page.getByRole('option', { name: 'White Rice' });
    await riceOption.click();
    await expect(page.getByRole('checkbox', { name: 'Include White Rice' })).toBeChecked();

    await quickSearch.fill('lean');
    const chickenOption = page.getByRole('option', { name: 'Lean Chicken' });
    await chickenOption.click();
    await expect(page.getByRole('checkbox', { name: 'Include Lean Chicken' })).toBeChecked();

    await page.getByRole('checkbox', { name: 'Include Olive Oil' }).check();

    await expect(calculateButton).toBeEnabled();

    await calculateButton.click();

    await expect(page.getByRole('heading', { name: 'Optimization results' })).toBeVisible();
    await expect(page.getByText(/Unable to meet macros within TOLLERANCE/)).toHaveCount(0);
  });
});
