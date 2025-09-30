export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiIngredient {
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
}

export interface ApiMeal {
  id: string;
  name: string;
  carbo: number;
  protein: number;
  fat: number;
}

export interface OptimizationRow {
  name: string;
  weight: number;
  carbo: number;
  protein: number;
  fat: number;
  kcal: number;
}
