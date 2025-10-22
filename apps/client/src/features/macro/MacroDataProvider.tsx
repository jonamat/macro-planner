import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { toast } from 'react-toastify';

import {
  createIngredient,
  createMeal,
  deleteIngredient,
  deleteMeal,
  fetchIngredients,
  fetchMeals,
  updateIngredient,
  updateMeal
} from '../../lib/api-client';
import { useAuth } from '../../providers/AuthProvider';
import type { ApiMeal } from '../../types/api';
import type {
  ClientIngredient,
  IngredientField,
  IngredientImportPayload,
  IngredientModalValues,
  MacroDataContextValue,
  MealImportPayload,
  MealModalValues
} from './types';
import {
  createIngredientPayload,
  createMealPayload,
  downloadJson,
  getStoredMealId,
  ingredientExportPayload,
  resetStoredMealId,
  sanitizeNullableNumber,
  sortIngredients,
  storeMealId,
  toClientIngredient,
  mealExportPayload
} from './utils';

interface MacroDataProviderProps {
  children: ReactNode;
}

const MacroDataContext = createContext<MacroDataContextValue | undefined>(undefined);

function sortMealsByName(items: ApiMeal[]) {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function MacroDataProvider({ children }: MacroDataProviderProps) {
  const { token } = useAuth();
  const [ingredients, setIngredients] = useState<ClientIngredient[]>([]);
  const [meals, setMeals] = useState<ApiMeal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setIngredients([]);
      setMeals([]);
      setSelectedMealId(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [ingredientData, mealData] = await Promise.all([
        fetchIngredients(token),
        fetchMeals(token)
      ]);

      const normalizedIngredients = sortIngredients(
        ingredientData.map((item) => toClientIngredient(item))
      );

      setIngredients(normalizedIngredients);
      const sortedMeals = sortMealsByName(mealData);
      setMeals(sortedMeals);

      const storedMealId = getStoredMealId();
      const initialMealId =
        storedMealId && sortedMeals.some((meal) => meal.id === storedMealId)
          ? storedMealId
          : sortedMeals[0]?.id ?? null;

      setSelectedMealId(initialMealId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!token) {
      resetStoredMealId();
      return;
    }
    storeMealId(selectedMealId);
  }, [selectedMealId, token]);

  const selectMeal = useCallback((mealId: string | null) => {
    setSelectedMealId(mealId);
  }, []);

  const selectedMeal = useMemo(
    () => meals.find((meal) => meal.id === selectedMealId) ?? null,
    [meals, selectedMealId]
  );

  const includedIngredients = useMemo(
    () => ingredients.filter((ingredient) => ingredient.included),
    [ingredients]
  );

  const ingredientsById = useMemo(() => {
    const lookup = new Map<string, ClientIngredient>();
    for (const ingredient of ingredients) {
      lookup.set(ingredient.id, ingredient);
    }
    return lookup;
  }, [ingredients]);

  const setIngredientFieldValue = useCallback(
    (ingredientId: string, field: IngredientField, rawValue: string) => {
      const nextValue = rawValue === '' ? null : Number(rawValue);
      if (rawValue !== '' && Number.isNaN(nextValue)) {
        return;
      }

      setIngredients((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          if (item.id !== ingredientId) {
            return item;
          }
          const currentValue = (item[field] ?? null) as number | null;
          if (Object.is(currentValue, nextValue)) {
            return item;
          }
          changed = true;
          return {
            ...item,
            [field]: nextValue
          };
        });
        return changed ? next : prev;
      });
    },
    []
  );

  const commitIngredientFieldValue = useCallback(
    async (ingredientId: string, field: IngredientField, rawValue: string) => {
      if (!token) return;

      const normalized = rawValue === '' ? null : Number(rawValue);
      if (rawValue !== '' && Number.isNaN(normalized)) {
        return;
      }

      const current = ingredientsById.get(ingredientId);
      if (!current) {
        return;
      }

      try {
        setSaving(true);
        const maybeNormalized =
          field === 'indivisible' && normalized !== null && normalized <= 0 ? null : normalized;

        const apiIngredient = await updateIngredient(token, ingredientId, {
          min: field === 'min' ? normalized : current.min,
          max: field === 'max' ? normalized : current.max,
          mandatory: field === 'mandatory' ? normalized : current.mandatory,
          indivisible: field === 'indivisible' ? maybeNormalized : current.indivisible
        });

        const normalizedIngredient = toClientIngredient(apiIngredient, current.included);

        setIngredients((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            if (item.id !== normalizedIngredient.id) {
              return item;
            }

            const isSame =
              item.min === normalizedIngredient.min &&
              item.max === normalizedIngredient.max &&
              item.mandatory === normalizedIngredient.mandatory &&
              item.carbo100g === normalizedIngredient.carbo100g &&
              item.protein100g === normalizedIngredient.protein100g &&
              item.fat100g === normalizedIngredient.fat100g &&
              item.indivisible === normalizedIngredient.indivisible;

            if (isSame) {
              return item;
            }

            changed = true;
            return { ...normalizedIngredient, included: item.included };
          });

          return changed ? next : prev;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to update ingredient';
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [ingredientsById, token]
  );

  const toggleIngredientInclude = useCallback((ingredientId: string, included: boolean) => {
    setIngredients((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.id !== ingredientId) {
          return item;
        }
        if (item.included === included) {
          return item;
        }
        changed = true;
        return { ...item, included };
      });
      return changed ? next : prev;
    });
  }, []);

  const resetIncluded = useCallback(() => {
    setIngredients((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (!item.included) {
          return item;
        }
        changed = true;
        return { ...item, included: false };
      });
      return changed ? next : prev;
    });
  }, []);

  const createIngredientAction = useCallback(
    async (values: IngredientModalValues) => {
      if (!token) return;
      try {
        setSaving(true);
        setError(null);
        const payload = createIngredientPayload(values);
        const created = await createIngredient(token, payload);
        setIngredients((prev) =>
          sortIngredients([...prev, toClientIngredient(created, true)])
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to create ingredient';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const updateIngredientAction = useCallback(
    async (id: string, values: IngredientModalValues) => {
      if (!token) return;
      const currentIngredient = ingredientsById.get(id);
      if (!currentIngredient) {
        throw new Error('Ingredient not found');
      }

      try {
        setSaving(true);
        setError(null);
        const payload = createIngredientPayload(values);
        const updated = await updateIngredient(token, id, payload);
        setIngredients((prev) =>
          sortIngredients(
            prev.map((item) =>
              item.id === updated.id
                ? toClientIngredient(updated, currentIngredient.included)
                : item
            )
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to update ingredient';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [ingredientsById, token]
  );

  const deleteIngredientAction = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        setSaving(true);
        setError(null);
        await deleteIngredient(token, id);
        setIngredients((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to delete ingredient';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const importIngredientsAction = useCallback(
    async (entries: IngredientImportPayload[]) => {
      if (!token || !entries.length) return;
      try {
        setSaving(true);
        setError(null);
        const created = await Promise.all(
          entries.map((payload) =>
            createIngredient(token, {
              name: payload.name,
              carbo100g: payload.carbo100g,
              protein100g: payload.protein100g,
              fat100g: payload.fat100g,
              min: sanitizeNullableNumber(payload.min),
              max: sanitizeNullableNumber(payload.max),
              mandatory: sanitizeNullableNumber(payload.mandatory),
              indivisible: sanitizeNullableNumber(payload.indivisible)
            })
          )
        );
        setIngredients((prev) =>
          sortIngredients([
            ...prev,
            ...created.map((item) => toClientIngredient(item))
          ])
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to import ingredients';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const exportIngredientsAction = useCallback(
    (mode: 'all' | 'included' = 'all') => {
      const source = mode === 'included' ? includedIngredients : ingredients;
      if (!source.length) {
        toast.info('No ingredients to export yet.');
        return;
      }
      downloadJson(ingredientExportPayload(source), 'ingredients.json');
    },
    [includedIngredients, ingredients]
  );

  const createMealAction = useCallback(
    async (values: MealModalValues) => {
      if (!token) return;
      try {
        setSaving(true);
        setError(null);
        const payload = createMealPayload(values);
        const created = await createMeal(token, payload);
        setMeals((prev) => sortMealsByName([...prev, created]));
        setSelectedMealId((prev) => prev ?? created.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to save meal';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const updateMealAction = useCallback(
    async (id: string, values: MealModalValues) => {
      if (!token) return;
      try {
        setSaving(true);
        setError(null);
        const payload = createMealPayload(values);
        const updated = await updateMeal(token, id, payload);
        setMeals((prev) =>
          sortMealsByName(prev.map((meal) => (meal.id === updated.id ? updated : meal)))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to save meal';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const deleteMealAction = useCallback(
    async (id: string) => {
      if (!token) return;
      const wasSelected = selectedMealId === id;
      try {
        setSaving(true);
        setError(null);
        await deleteMeal(token, id);
        setMeals((prev) => {
          const next = prev.filter((meal) => meal.id !== id);
          if (wasSelected) {
            const fallback = next[0]?.id ?? null;
            setSelectedMealId(fallback);
          }
          return sortMealsByName(next);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to delete meal';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [selectedMealId, token]
  );

  const importMealsAction = useCallback(
    async (entries: MealImportPayload[]) => {
      if (!token || !entries.length) return;
      try {
        setSaving(true);
        setError(null);
        const created = await Promise.all(
          entries.map((payload) => createMeal(token, payload))
        );
        setMeals((prev) => sortMealsByName([...prev, ...created]));
        setSelectedMealId((prev) => prev ?? created[0]?.id ?? prev);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to import meals';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const exportMealsAction = useCallback(() => {
    if (!meals.length) {
      toast.info('No meals to export yet.');
      return;
    }
    downloadJson(mealExportPayload(meals), 'meals.json');
  }, [meals]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<MacroDataContextValue>(
    () => ({
      meals,
      ingredients,
      selectedMealId,
      loading,
      saving,
      error,
      selectedMeal,
      includedIngredients,
      selectMeal,
      createMeal: createMealAction,
      updateMeal: updateMealAction,
      deleteMeal: deleteMealAction,
      importMeals: importMealsAction,
      exportMeals: exportMealsAction,
      setIngredientFieldValue,
      commitIngredientFieldValue,
      toggleIngredientInclude,
      resetIncluded,
      createIngredient: createIngredientAction,
      updateIngredient: updateIngredientAction,
      deleteIngredient: deleteIngredientAction,
      importIngredients: importIngredientsAction,
      exportIngredients: exportIngredientsAction,
      clearError,
      reload: loadData
    }),
    [
      clearError,
      commitIngredientFieldValue,
      createIngredientAction,
      createMealAction,
      deleteIngredientAction,
      deleteMealAction,
      error,
      exportIngredientsAction,
      exportMealsAction,
      importIngredientsAction,
      importMealsAction,
      includedIngredients,
      ingredients,
      loadData,
      loading,
      meals,
      resetIncluded,
      saving,
      selectMeal,
      selectedMeal,
      selectedMealId,
      setIngredientFieldValue,
      toggleIngredientInclude,
      updateIngredientAction,
      updateMealAction
    ]
  );

  return <MacroDataContext.Provider value={value}>{children}</MacroDataContext.Provider>;
}

export function useMacroData() {
  const ctx = useContext(MacroDataContext);
  if (!ctx) {
    throw new Error('useMacroData must be used within MacroDataProvider');
  }
  return ctx;
}
