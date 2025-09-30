import type { ApiIngredient, OptimizationRow } from '../../types/api';

export type IngredientField = 'min' | 'max' | 'mandatory';

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
