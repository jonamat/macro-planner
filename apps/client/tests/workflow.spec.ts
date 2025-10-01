import { test, expect } from '@playwright/test';

test.describe('Macro Planner end-to-end workflow', () => {
  test('user can signup, login, manage data, and calculate macros', async ({ page }) => {
    type StoredMeal = {
      id: string;
      name: string;
      carbo: number;
      protein: number;
      fat: number;
    };

    type StoredIngredient = {
      id: string;
      name: string;
      carbo100g: number;
      protein100g: number;
      fat100g: number;
      min: number | null;
      max: number | null;
      mandatory: number | null;
      indivisible: number | null;
      sequence: number;
    };

    interface UserRecord {
      id: string;
      password: string;
      token: string;
    }

    const users = new Map<string, UserRecord>();
    const meals: StoredMeal[] = [];
    const ingredients: StoredIngredient[] = [];
    let mealCounter = 0;
    let ingredientCounter = 0;

    await page.route('**/api/auth/signup', async (route, request) => {
      if (request.method() !== 'POST') return route.fallback();

      const payload = JSON.parse(request.postData() ?? '{}') as { username?: string; password?: string };
      const username = (payload.username ?? '').trim().toLowerCase();
      const password = payload.password ?? '';

      const userId = `user-${users.size + 1}`;
      const token = `token-${Math.random().toString(36).slice(2)}`;
      users.set(username, { id: userId, password, token });

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          token,
          user: { id: userId, username }
        })
      });
    });

    await page.route('**/api/auth/login', async (route, request) => {
      if (request.method() !== 'POST') return route.fallback();

      const payload = JSON.parse(request.postData() ?? '{}') as { username?: string; password?: string };
      const username = (payload.username ?? '').trim().toLowerCase();
      const password = payload.password ?? '';
      const record = users.get(username);

      if (!record || record.password !== password) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: record.token,
          user: { id: record.id, username }
        })
      });
    });

    await page.route('**/api/meals', async (route, request) => {
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: meals })
        });
        return;
      }

      if (method === 'POST') {
        const payload = JSON.parse(request.postData() ?? '{}') as Partial<StoredMeal>;
        const meal: StoredMeal = {
          id: `meal-${++mealCounter}`,
          name: payload.name ?? 'Meal',
          carbo: Number(payload.carbo ?? 0),
          protein: Number(payload.protein ?? 0),
          fat: Number(payload.fat ?? 0)
        };
        meals.push(meal);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: meal })
        });
        return;
      }

      route.fallback();
    });

    await page.route('**/api/ingredients', async (route, request) => {
      const method = request.method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: ingredients })
        });
        return;
      }

      if (method === 'POST') {
        const payload = JSON.parse(request.postData() ?? '{}') as Partial<StoredIngredient>;
        const ingredient: StoredIngredient = {
          id: `ing-${++ingredientCounter}`,
          name: payload.name ?? 'Ingredient',
          carbo100g: Number(payload.carbo100g ?? 0),
          protein100g: Number(payload.protein100g ?? 0),
          fat100g: Number(payload.fat100g ?? 0),
          min: payload.min ?? null,
          max: payload.max ?? null,
          mandatory: payload.mandatory ?? null,
          indivisible: payload.indivisible ?? null,
          sequence: payload.sequence ?? ingredients.length
        };
        ingredients.push(ingredient);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ data: ingredient })
        });
        return;
      }

      route.fallback();
    });

    await page.route('**/api/ingredients/*', async (route, request) => {
      const url = request.url();
      const id = url.split('/').pop() ?? '';
      const target = ingredients.find((item) => item.id === id) ?? null;

      if (request.method() === 'PATCH') {
        const payload = JSON.parse(request.postData() ?? '{}') as Partial<StoredIngredient>;
        if (target) {
          Object.assign(target, payload);
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: target })
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: target })
      });
    });

    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup$/);

    await page.fill('input[placeholder="user"]', 'integrationUser');
    await page.fill('input[type="password"]', 'super-secret');
    await Promise.all([
      page.waitForResponse('**/api/auth/signup'),
      page.click('button:has-text("Sign up")')
    ]);

    await page.waitForResponse('**/api/ingredients');
    await page.waitForResponse('**/api/meals');
    await expect(page).toHaveURL('http://localhost:4173/');

    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/\/login$/);

    await page.fill('input[placeholder="user"]', 'integrationuser');
    await page.fill('input[type="password"]', 'super-secret');
    await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.click('button:has-text("Login")')
    ]);

    await page.waitForResponse('**/api/ingredients');
    await page.waitForResponse('**/api/meals');

    await page.click('button:has-text("Add Meal")');
    await expect(page.getByRole('heading', { name: 'Add meal' })).toBeVisible();
    await page.fill('#meal-name', 'Precise Meal');
    await page.fill('#meal-carbo', '1');
    await page.fill('#meal-protein', '1');
    await page.fill('#meal-fat', '1');
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/meals') && response.request().method() === 'POST'
      ),
      page.click('button:has-text("Save")')
    ]);
    await expect(page.getByRole('heading', { name: 'Add meal' })).not.toBeVisible();

    await page.click('button:has-text("Add Ingredient")');
    await expect(page.getByRole('heading', { name: 'Add ingredient' })).toBeVisible();
    await page.fill('#ingredient-name', 'Unit Ingredient');
    await page.fill('#ingredient-carbo', '1');
    await page.fill('#ingredient-protein', '1');
    await page.fill('#ingredient-fat', '1');
    await page.fill('#ingredient-mandatory', '100');
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/ingredients') && response.request().method() === 'POST'
      ),
      page.click('button:has-text("Save")')
    ]);
    await expect(page.getByRole('heading', { name: 'Add ingredient' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unit Ingredient' })).toBeVisible();

    await page.click('button:has-text("Calculate")');

    const modal = page.getByRole('heading', { name: 'Optimization results' });
    await expect(modal).toBeVisible();

    const ingredientRow = page.locator('tbody tr').filter({ hasText: 'Unit Ingredient' });
    await expect(ingredientRow.locator('td').nth(1)).toHaveText('100.00');

    const deviationRow = page.locator('tbody tr').filter({ hasText: 'Deviation (%)' });
    await expect(deviationRow.locator('td').nth(2)).toHaveText('0.00');
    await expect(deviationRow.locator('td').nth(3)).toHaveText('0.00');
    await expect(deviationRow.locator('td').nth(4)).toHaveText('0.00');
  });
});
