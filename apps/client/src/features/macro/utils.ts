import type { ApiIngredient, ApiMeal } from '../../types/api';
import type { ClientIngredient, IngredientImportPayload, MealImportPayload } from './types';

const ZERO_EPSILON = 1e-6;

export const LAST_SELECTED_MEAL_KEY = 'macro-calculator-last-meal';

export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeNullableNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function sanitizePositiveStep(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isFinite(value) || Math.abs(value) < ZERO_EPSILON) {
    return null;
  }
  return value;
}

export function toClientIngredient(record: ApiIngredient, included = false): ClientIngredient {
  return {
    ...record,
    min: sanitizeNullableNumber(record.min),
    max: sanitizeNullableNumber(record.max),
    mandatory: sanitizeNullableNumber(record.mandatory),
    indivisible: sanitizePositiveStep(record.indivisible),
    included
  };
}

export function sortIngredients(items: ClientIngredient[]) {
  return items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function toOptionalBound(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Math.abs(value) < ZERO_EPSILON) {
    return undefined;
  }
  return value;
}

export function createMealPayload(values: {
  name: string;
  carbo: string;
  protein: string;
  fat: string;
}) {
  const payload = {
    name: values.name.trim(),
    carbo: Number(values.carbo),
    protein: Number(values.protein),
    fat: Number(values.fat)
  } as const;

  const hasName = Boolean(payload.name);
  const macros = [payload.carbo, payload.protein, payload.fat];
  const hasValidMacros = macros.every((value) => Number.isFinite(value));

  if (!hasName || !hasValidMacros) {
    throw new Error('Name and macro targets are required');
  }

  return payload;
}

export function createIngredientPayload(values: {
  name: string;
  carbo100g: string;
  protein100g: string;
  fat100g: string;
  min: string;
  max: string;
  mandatory: string;
  indivisible: string;
}) {
  const payload = {
    name: values.name.trim(),
    carbo100g: Number(values.carbo100g),
    protein100g: Number(values.protein100g),
    fat100g: Number(values.fat100g),
    min: parseOptionalNumber(values.min),
    max: parseOptionalNumber(values.max),
    mandatory: parseOptionalNumber(values.mandatory),
    indivisible: parseOptionalNumber(values.indivisible)
  } as const;

  const normalizedMax =
    payload.max != null && Math.abs(payload.max) < ZERO_EPSILON ? null : payload.max;

  const hasName = Boolean(payload.name);
  const macros = [payload.carbo100g, payload.protein100g, payload.fat100g];
  const hasValidMacros = macros.every((value) => Number.isFinite(value));

  if (!hasName || !hasValidMacros) {
    throw new Error('Name and macronutrients are required');
  }

  return {
    ...payload,
    max: normalizedMax
  };
}

export function buildMealInitialState(meal: ApiMeal) {
  return {
    name: meal.name,
    carbo: String(meal.carbo),
    protein: String(meal.protein),
    fat: String(meal.fat)
  };
}

export function buildIngredientInitialState(ingredient: ClientIngredient) {
  return {
    name: ingredient.name,
    carbo100g: String(ingredient.carbo100g),
    protein100g: String(ingredient.protein100g),
    fat100g: String(ingredient.fat100g),
    min: ingredient.min != null ? String(ingredient.min) : '',
    max: ingredient.max != null ? String(ingredient.max) : '',
    mandatory: ingredient.mandatory != null ? String(ingredient.mandatory) : '',
    indivisible: ingredient.indivisible != null ? String(ingredient.indivisible) : ''
  };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function mealExportPayload(meals: ApiMeal[]) {
  return meals.map((meal) => ({
    name: meal.name,
    carbo: meal.carbo,
    protein: meal.protein,
    fat: meal.fat
  }));
}

export function ingredientExportPayload(ingredients: ClientIngredient[]) {
  return ingredients.map((ingredient) => ({
    name: ingredient.name,
    carbo100g: ingredient.carbo100g,
    protein100g: ingredient.protein100g,
    fat100g: ingredient.fat100g,
    ...(ingredient.min != null ? { min: ingredient.min } : {}),
    ...(ingredient.max != null ? { max: ingredient.max } : {}),
    ...(ingredient.mandatory != null ? { mandatory: ingredient.mandatory } : {}),
    ...(ingredient.indivisible != null ? { indivisible: ingredient.indivisible } : {})
  }));
}

export function getStoredMealId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(LAST_SELECTED_MEAL_KEY);
}

export function storeMealId(mealId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!mealId) {
    localStorage.removeItem(LAST_SELECTED_MEAL_KEY);
    return;
  }
  localStorage.setItem(LAST_SELECTED_MEAL_KEY, mealId);
}

export function resetStoredMealId() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(LAST_SELECTED_MEAL_KEY);
}

export function parseMealsJson(text: string): MealImportPayload[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid meals file format');
  }

  return parsed.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Invalid meal entry at index ${index}`);
    }
    const raw = entry as Record<string, unknown>;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const carbo = Number(raw.carbo);
    const protein = Number(raw.protein);
    const fat = Number(raw.fat);

    if (!name || !Number.isFinite(carbo) || !Number.isFinite(protein) || !Number.isFinite(fat)) {
      throw new Error(`Invalid meal entry at index ${index}`);
    }

    return { name, carbo, protein, fat };
  });
}

export function parseIngredientsJson(text: string): IngredientImportPayload[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid ingredients file format');
  }

  const normalizeOptional = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  return parsed.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`Invalid ingredient entry at index ${index}`);
    }
    const raw = entry as Record<string, unknown>;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const carbo100g = Number(raw.carbo100g);
    const protein100g = Number(raw.protein100g);
    const fat100g = Number(raw.fat100g);
    const min = normalizeOptional(raw.min);
    const parsedMax = normalizeOptional(raw.max);
    const max = parsedMax != null && Math.abs(parsedMax) < ZERO_EPSILON ? null : parsedMax;
    const mandatory = normalizeOptional(raw.mandatory);
    const indivisible = normalizeOptional(raw.indivisible);

    const macros = [carbo100g, protein100g, fat100g];
    if (!name || macros.some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid ingredient entry at index ${index}`);
    }

    return {
      name,
      carbo100g,
      protein100g,
      fat100g,
      min,
      max,
      mandatory,
      indivisible
    };
  });
}
