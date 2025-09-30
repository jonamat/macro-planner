import { test, expect, Page } from '@playwright/test';

async function mockAuthLogin(page: Page) {
  await page.route('**/api/auth/login', async (route, request) => {
    if (request.method() !== 'POST') {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-token',
        user: { id: 'user-1', username: 'testuser' }
      })
    });
  });
}

async function mockIngredients(page: Page, data: unknown) {
  await page.route('**/api/ingredients', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data })
    });
  });
}

async function mockMeals(page: Page, data: unknown) {
  await page.route('**/api/meals', async (route, request) => {
    if (request.method() !== 'GET') {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data })
    });
  });
}

test.describe('Macro Planner app', () => {
  test('logs in and displays user data', async ({ page }) => {
    await mockAuthLogin(page);
    await mockIngredients(page, [
      {
        id: 'ing-1',
        name: 'Greek yogurt',
        carbo100g: 4,
        protein100g: 10,
        fat100g: 0,
        min: null,
        max: null,
        mandatory: null,
        indivisible: null,
        sequence: 0
      }
    ]);
    await mockMeals(page, [
      {
        id: 'meal-1',
        name: 'Breakfast',
        carbo: 60,
        protein: 30,
        fat: 15
      }
    ]);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await page.fill('input[placeholder="user"]', 'testuser');
    await page.fill('input[type="password"]', 'secret-password');

    const [loginResponse] = await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.click('button:has-text("Login")')
    ]);
    expect(loginResponse.ok()).toBeTruthy();

    await expect(page).toHaveURL('http://localhost:4173/');

    await page.waitForResponse('**/api/ingredients');
    await page.waitForResponse('**/api/meals');

    await expect(page.getByText('Macro Planner')).toBeVisible();
    await expect(page.getByText('Add Ingredient')).toBeVisible();
    await expect(page.getByText('Greek yogurt')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
  });

  test('allows navigating to signup and creating an account', async ({ page }) => {
    await page.route('**/api/auth/signup', async (route, request) => {
      if (request.method() !== 'POST') {
        return route.fallback();
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'signup-token',
          user: { id: 'user-2', username: 'newuser' }
        })
      });
    });

    await mockIngredients(page, []);
    await mockMeals(page, []);

    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup$/);

    await page.fill('input[placeholder="user"]', 'newuser');
    await page.fill('input[type="password"]', 'new-password');

    const [signupResponse] = await Promise.all([
      page.waitForResponse('**/api/auth/signup'),
      page.click('button:has-text("Sign up")')
    ]);
    expect(signupResponse.ok()).toBeTruthy();

    await expect(page).toHaveURL('http://localhost:4173/');
  });

  test('lets users add ingredient details without client errors', async ({ page }) => {
    const errors: Error[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => errors.push(err));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await mockAuthLogin(page);
    await mockIngredients(page, []);
    await mockMeals(page, []);

    await page.route('**/api/ingredients', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'ing-new',
            name: 'New ingredient',
            carbo100g: 10,
            protein100g: 5,
            fat100g: 1,
            min: null,
            max: null,
            mandatory: null,
            indivisible: null,
            sequence: 0
          }
        })
      });
    });

    await page.goto('/');
    await page.fill('input[placeholder="user"]', 'testuser');
    await page.fill('input[type="password"]', 'secret-password');
    await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.click('button:has-text("Login")')
    ]);

    await page.waitForResponse('**/api/ingredients');
    await page.waitForResponse('**/api/meals');

    expect(await page.evaluate(() => localStorage.getItem('macro-calculator-token'))).toBe('test-token');

    await page.click('button:has-text("Add Ingredient")');
    await expect(page.getByRole('heading', { name: 'Add ingredient' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Name' }).fill('New ingredient');

    expect(errors).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
  });

  test('allows reordering ingredients and persists sequence updates', async ({ page }) => {
    await mockAuthLogin(page);

    const ingredients = [
      {
        id: 'ing-1',
        name: 'Almonds',
        carbo100g: 22,
        protein100g: 21,
        fat100g: 50,
        min: null,
        max: null,
        mandatory: null,
        indivisible: null,
        sequence: 0
      },
      {
        id: 'ing-2',
        name: 'Broccoli',
        carbo100g: 7,
        protein100g: 3,
        fat100g: 0,
        min: null,
        max: null,
        mandatory: null,
        indivisible: null,
        sequence: 1
      },
      {
        id: 'ing-3',
        name: 'Chicken breast',
        carbo100g: 0,
        protein100g: 31,
        fat100g: 4,
        min: null,
        max: null,
        mandatory: null,
        indivisible: null,
        sequence: 2
      }
    ];

    await page.addInitScript(({ ingredients: initIngredients }) => {
      const originalFetch = window.fetch;
      const ingredientMap = new Map(initIngredients.map((ingredient: any) => [ingredient.id, { ...ingredient }]));
      (window as any).__patchCalls = [];

      const interceptFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const url = typeof input === 'string' ? input : input.url;
        const method = (init.method ?? 'GET').toUpperCase();

        if (url.includes('/api/ingredients/') && method === 'PATCH') {
          const id = url.split('/').pop() ?? '';
          const current = ingredientMap.get(id);
          const textBody = typeof init.body === 'string' ? init.body : init.body ? init.body.toString() : '{}';
          const payload = JSON.parse(textBody);

          if (current) {
            Object.assign(current, payload);
            (window as any).__patchCalls.push({ id, body: payload });
            return new Response(
              JSON.stringify({ data: current }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response(JSON.stringify({ message: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return originalFetch(input, init);
      };
      window.fetch = interceptFetch;
      (globalThis as any).fetch = interceptFetch;
    }, { ingredients });

    await mockIngredients(page, ingredients);
    await mockMeals(page, [
      {
        id: 'meal-1',
        name: 'Lunch',
        carbo: 60,
        protein: 30,
        fat: 15
      }
    ]);

    await page.goto('/');
    await page.fill('input[placeholder="user"]', 'testuser');
    await page.fill('input[type="password"]', 'secret-password');
    await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.click('button:has-text("Login")')
    ]);

    await page.waitForResponse('**/api/ingredients');
    await page.waitForResponse('**/api/meals');

    await page.dragAndDrop('[data-testid="ingredient-card-ing-3"]', '[data-testid="ingredient-card-ing-1"]');

    await expect(page.locator('[data-testid^="ingredient-card-"] h2').first()).toHaveText('Chicken breast');
    await expect.poll(async () => {
      return await page.evaluate(() => (window as any).__patchCalls?.length ?? 0);
    }).toBe(3);

    const cardTitles = await page.locator('[data-testid^="ingredient-card-"] h2').allTextContents();
    expect(cardTitles[0]).toBe('Chicken breast');

    const sequences = (await page.evaluate(() => (window as any).__patchCalls ?? []))
      .map((call: { id: string; body: Record<string, unknown> }) => ({ id: call.id, sequence: call.body.sequence }))
      .sort((a, b) => (a.id > b.id ? 1 : -1));

    expect(sequences).toEqual([
      { id: 'ing-1', sequence: 1 },
      { id: 'ing-2', sequence: 2 },
      { id: 'ing-3', sequence: 0 }
    ]);
  });
});
