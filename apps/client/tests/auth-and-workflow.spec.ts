import { expect, test } from '@playwright/test';

const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const credentials = {
  username: `e2e-${suffix}`,
  password: 'Secret123!'
};

const apiPort = Number(process.env.SERVER_PORT ?? '4100');

async function logout(page: Parameters<typeof test>[0]['page']) {
  const logoutLink = page.getByRole('link', { name: 'Logout' });
  if ((await logoutLink.count()) > 0 && (await logoutLink.first().isVisible())) {
    await logoutLink.first().scrollIntoViewIfNeeded();
    await logoutLink.first().click();
    await expect(page).toHaveURL(/\/login$/);
  }
}

async function login(page: Parameters<typeof test>[0]['page'], username = credentials.username, password = credentials.password) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible({ timeout: 10_000 });
}

async function addMeal(
  page: Parameters<typeof test>[0]['page'],
  { name, carbo, protein, fat }: { name: string; carbo: number; protein: number; fat: number }
) {
  await page.getByRole('button', { name: 'Add meal' }).click();
  await page.fill('#meal-name', name);
  await page.fill('#meal-carbs', String(carbo));
  await page.fill('#meal-protein', String(protein));
  await page.fill('#meal-fat', String(fat));
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector('#meal-name', { state: 'detached' });

  const mealSelect = page.locator('select');
  await mealSelect.selectOption({ label: name });
  const summaryText = `${carbo}g carbs · ${protein}g protein · ${fat}g fat`;
  await expect(page.getByText(summaryText)).toBeVisible();
}

async function addIngredient(
  page: Parameters<typeof test>[0]['page'],
  {
    name,
    carbo,
    protein,
    fat
  }: { name: string; carbo: number; protein: number; fat: number }
) {
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await page.fill('#ingredient-name', name);
  await page.fill('#ingredient-carbo', String(carbo));
  await page.fill('#ingredient-protein', String(protein));
  await page.fill('#ingredient-fat', String(fat));
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector('#ingredient-name', { state: 'detached' });

  await expect(page.getByText(name).first()).toBeVisible();
}

test.describe.serial('Macro Planner critical flows', () => {
  test('1. signup flow', async ({ page }) => {
    await page.goto('/signup');
    await expect.poll(async () => (await page.request.get(`http://localhost:${apiPort}/api/health`)).status(), {
      timeout: 15_000
    }).toBe(200);
    await page.fill('#signup-username', credentials.username);
    await page.fill('#signup-password', credentials.password);
    const signupResponsePromise = page.waitForResponse('**/api/auth/signup');
    await page.getByRole('button', { name: 'Sign up' }).click();
    const signupResponse = await signupResponsePromise;
    expect(signupResponse.status()).toBe(201);

    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible({ timeout: 10_000 });
    await logout(page);
  });

  test('2. login flow success and error cases', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(credentials.username);
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();

    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible({ timeout: 10_000 });
    await logout(page);
  });

  test('3. add meal flow', async ({ page }) => {
    await login(page);
    await addMeal(page, {
      name: `Meal-${suffix}`,
      carbo: 30,
      protein: 30,
      fat: 15
    });
    await expect(page.getByText('Meal target').first()).toBeVisible();
    await logout(page);
  });

  test('4. add ingredient flow', async ({ page }) => {
    await login(page);
    const ingredientName = `Ingredient-${suffix}`;
    await addIngredient(page, {
      name: ingredientName,
      carbo: 25,
      protein: 5,
      fat: 10
    });
    await expect(page.getByText(ingredientName).first()).toBeVisible();
    await logout(page);
  });

  test('5. calculate a simple meal successfully', async ({ page }) => {
    await login(page);

    const resetButton = page.getByRole('button', { name: 'Reset list' });
    if (await resetButton.isEnabled()) {
      await resetButton.click();
    }

    const successIngredient = `Balanced Ingredient ${suffix}`;
    await addIngredient(page, {
      name: successIngredient,
      carbo: 10,
      protein: 10,
      fat: 5
    });

    const successMeal = `Balanced Meal ${suffix}`;
    await addMeal(page, {
      name: successMeal,
      carbo: 20,
      protein: 20,
      fat: 10
    });

    await expect(page.getByRole('button', { name: /Calculate/ })).toBeEnabled();
    await page.getByRole('button', { name: /Calculate/ }).click();

    await expect(page.getByRole('heading', { name: 'Optimization Results' })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(successIngredient, 'i') })).toBeVisible();
    await logout(page);
  });

  test('6. calculate a simple meal with error toast', async ({ page }) => {
    await login(page);

    const resetButton = page.getByRole('button', { name: 'Reset list' });
    if (await resetButton.isEnabled()) {
      await resetButton.click();
    }

    const carbOnlyIngredient = `Carb Source ${suffix}`;
    await addIngredient(page, {
      name: carbOnlyIngredient,
      carbo: 40,
      protein: 0,
      fat: 0
    });

    const proteinMeal = `Protein Target ${suffix}`;
    await addMeal(page, {
      name: proteinMeal,
      carbo: 0,
      protein: 25,
      fat: 0
    });

    await expect(page.getByRole('button', { name: /Calculate/ })).toBeEnabled();
    await page.getByRole('button', { name: /Calculate/ }).click();

    const toast = page.locator('[role="alert"]').filter({ hasText: /Unable to meet macros/i });
    await expect(toast).toBeVisible();
    await logout(page);
  });
});
