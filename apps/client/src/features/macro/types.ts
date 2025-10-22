import type { ApiIngredient, ApiMeal, OptimizationRow } from '../../types/api';

export type IngredientField = 'min' | 'max' | 'mandatory' | 'indivisible';

export interface IngredientModalValues {
  name: string;
  carbo100g: string;
  protein100g: string;
  fat100g: string;
  min: string;
  max: string;
  mandatory: string;
  indivisible: string;
}

export interface MealModalValues {
  name: string;
  carbo: string;
  protein: string;
  fat: string;
}

export interface CalculationState {
  targetName: string;
  targetCarbo: number;
  targetProtein: number;
  targetFat: number;
  targetKcal: number;
  rows: OptimizationRow[];
  totalWeight: number;
  totalCarbo: number;
  totalProtein: number;
  totalFat: number;
  totalKcal: number;
  deviationCarbo: number;
  deviationProtein: number;
  deviationFat: number;
  deviationKcal: number;
}

export interface ClientIngredient extends ApiIngredient {
  included: boolean;
}

export interface MacroDataError {
  message: string;
}

export interface MacroDataState {
  meals: ApiMeal[];
  ingredients: ClientIngredient[];
  selectedMealId: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface MealImportPayload {
  name: string;
  carbo: number;
  protein: number;
  fat: number;
}

export interface IngredientImportPayload {
  name: string;
  carbo100g: number;
  protein100g: number;
  fat100g: number;
  min: number | null;
  max: number | null;
  mandatory: number | null;
  indivisible: number | null;
}

export interface MacroDataContextValue extends MacroDataState {
  selectedMeal: ApiMeal | null;
  includedIngredients: ClientIngredient[];
  selectMeal: (mealId: string | null) => void;
  createMeal: (values: MealModalValues) => Promise<void>;
  updateMeal: (id: string, values: MealModalValues) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  importMeals: (entries: MealImportPayload[]) => Promise<void>;
  exportMeals: () => void;
  setIngredientFieldValue: (id: string, field: IngredientField, value: string) => void;
  commitIngredientFieldValue: (id: string, field: IngredientField, value: string) => Promise<void>;
  toggleIngredientInclude: (id: string, included: boolean) => void;
  resetIncluded: () => void;
  createIngredient: (values: IngredientModalValues) => Promise<void>;
  updateIngredient: (id: string, values: IngredientModalValues) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  importIngredients: (entries: IngredientImportPayload[]) => Promise<void>;
  exportIngredients: (mode?: 'all' | 'included') => void;
  clearError: () => void;
  reload: () => Promise<void>;
}
