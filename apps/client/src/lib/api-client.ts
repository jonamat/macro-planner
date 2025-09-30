import type { MacroTarget } from '@macro-calculator/shared';

import type { ApiIngredient, ApiMeal, AuthResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.method && init.method !== 'GET' && init.method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String(payload.message)
      : 'Request failed';
    throw new Error(message);
  }

  return (payload as T) ?? ({} as T);
}

export async function login(username: string, password: string) {
  const result = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return result;
}

export async function signup(username: string, password: string) {
  const result = await request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return result;
}

export async function fetchIngredients(token: string) {
  const result = await request<{ data: ApiIngredient[] }>('/ingredients', {}, token);
  return result.data;
}

export async function createIngredient(token: string, input: Partial<ApiIngredient>) {
  const result = await request<{ data: ApiIngredient }>(
    '/ingredients',
    {
      method: 'POST',
      body: JSON.stringify(input)
    },
    token
  );
  return result.data;
}

export async function updateIngredient(token: string, id: string, input: Partial<ApiIngredient>) {
  const result = await request<{ data: ApiIngredient }>(
    `/ingredients/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input)
    },
    token
  );
  return result.data;
}

export async function fetchMeals(token: string) {
  const result = await request<{ data: ApiMeal[] }>('/meals', {}, token);
  return result.data;
}

export async function createMeal(token: string, input: Partial<ApiMeal>) {
  const result = await request<{ data: ApiMeal }>(
    '/meals',
    {
      method: 'POST',
      body: JSON.stringify(input)
    },
    token
  );
  return result.data;
}

export async function updateMeal(token: string, id: string, input: Partial<ApiMeal>) {
  const result = await request<{ data: ApiMeal }>(
    `/meals/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input)
    },
    token
  );
  return result.data;
}

export function targetFromMeal(meal: ApiMeal): MacroTarget {
  return {
    name: meal.name,
    carbo: meal.carbo,
    protein: meal.protein,
    fat: meal.fat
  };
}
