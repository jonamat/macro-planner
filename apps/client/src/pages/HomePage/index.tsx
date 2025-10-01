import { Box, Button, Flex, Stack, useDisclosure } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { optimizeMealToMacro } from "@macro-calculator/shared";

import {
  createIngredient,
  createMeal,
  fetchIngredients,
  fetchMeals,
  targetFromMeal,
  updateIngredient,
  updateMeal,
} from "../../lib/api-client";
import { useAuth } from "../../providers/AuthProvider";
import type { ApiIngredient, ApiMeal } from "../../types/api";
import type {
  CalculationState,
  ClientIngredient,
  IngredientField,
  IngredientModalValues,
  MealModalValues,
} from "./types";
import { parseOptionalNumber } from "./utils";
import { HeaderSection } from "./HeaderSection";
import { IngredientList } from "./IngredientList";
import { MealsPanel } from "./MealsPanel";
import { IngredientModal } from "./IngredientModal";
import { MealModal } from "./MealModal";
import { ResultsModal } from "./ResultsModal";
import type { ChangeEvent } from "react";

const ZERO_EPSILON = 1e-6;
const LAST_SELECTED_MEAL_KEY = "macro-calculator-last-meal";

function sanitizeNullableNumber(
  value: number | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function sanitizePositiveStep(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value) || Math.abs(value) < ZERO_EPSILON) {
    return null;
  }

  return value;
}

function toClientIngredient(
  record: ApiIngredient,
  included = false
): ClientIngredient {
  return {
    id: record.id,
    name: record.name,
    carbo100g: record.carbo100g,
    protein100g: record.protein100g,
    fat100g: record.fat100g,
    min: sanitizeNullableNumber(record.min),
    max: sanitizeNullableNumber(record.max),
    mandatory: sanitizeNullableNumber(record.mandatory),
    indivisible: sanitizePositiveStep(record.indivisible),
    sequence: record.sequence,
    included,
  };
}

function toOptionalBound(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Math.abs(value) < ZERO_EPSILON) {
    return undefined;
  }

  return value;
}

function HomePage() {
  const { token, user, logout } = useAuth();

  const ingredientModal = useDisclosure();
  const editIngredientModal = useDisclosure();
  const mealModal = useDisclosure();
  const editMealModal = useDisclosure();
  const resultsModal = useDisclosure();

  const [ingredients, setIngredients] = useState<ClientIngredient[]>([]);
  const [meals, setMeals] = useState<ApiMeal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<CalculationState | null>(null);
  const [editingMeal, setEditingMeal] = useState<ApiMeal | null>(null);
  const [editingIngredient, setEditingIngredient] =
    useState<ClientIngredient | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealImportInputRef = useRef<HTMLInputElement | null>(null);
  const ingredientImportInputRef = useRef<HTMLInputElement | null>(null);

  const sortIngredients = useCallback(
    (items: ClientIngredient[]) =>
      items.slice().sort((a, b) => {
        const seqA =
          typeof a.sequence === "number" ? a.sequence : Number.MAX_SAFE_INTEGER;
        const seqB =
          typeof b.sequence === "number" ? b.sequence : Number.MAX_SAFE_INTEGER;
        if (seqA !== seqB) {
          return seqA - seqB;
        }
        return a.name.localeCompare(b.name);
      }),
    []
  );

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ingredientData, mealData] = await Promise.all([
          fetchIngredients(token),
          fetchMeals(token),
        ]);
        const normalizedIngredients = sortIngredients(
          ingredientData.map((item) => toClientIngredient(item))
        );
        setIngredients(normalizedIngredients);
        setMeals(mealData);

        const storedMealId =
          typeof window !== "undefined"
            ? localStorage.getItem(LAST_SELECTED_MEAL_KEY)
            : null;

        const initialMealId =
          storedMealId && mealData.some((meal) => meal.id === storedMealId)
            ? storedMealId
            : mealData[0]?.id ?? null;

        setSelectedMealId(initialMealId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sortIngredients, token]);

  const selectedMeal = useMemo(
    () => meals.find((meal) => meal.id === selectedMealId) ?? null,
    [meals, selectedMealId]
  );

  useEffect(() => {
    if (!selectedMealId) return;
    if (typeof window === "undefined") return;

    localStorage.setItem(LAST_SELECTED_MEAL_KEY, selectedMealId);
  }, [selectedMealId]);

  const hasIncludedIngredients = useMemo(
    () => ingredients.some((ingredient) => ingredient.included),
    [ingredients]
  );

  const handleIngredientFieldChange = useCallback(
    (ingredientId: string, field: IngredientField, rawValue: string) => {
      const nextValue = rawValue === "" ? null : Number(rawValue);
      if (rawValue !== "" && Number.isNaN(nextValue)) {
        return;
      }

      setIngredients((prev) =>
        prev.map((item) =>
          item.id === ingredientId
            ? {
                ...item,
                [field]: nextValue,
              }
            : item
        )
      );
    },
    []
  );

  const handleIngredientFieldCommit = useCallback(
    async (ingredient: ClientIngredient) => {
      if (!token) return;

      const latest = ingredients.find((item) => item.id === ingredient.id);
      if (!latest) return;

      try {
        setSaving(true);
        await updateIngredient(token, ingredient.id, {
          min: latest.min,
          max: latest.max,
          mandatory: latest.mandatory,
          sequence: latest.sequence,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update ingredient";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [ingredients, token]
  );

  const handleIngredientCreate = useCallback(
    async (values: IngredientModalValues) => {
      if (!token) return;
      try {
        setSaving(true);
        setError(null);
        const payload = {
          name: values.name.trim(),
          carbo100g: Number(values.carbo100g),
          protein100g: Number(values.protein100g),
          fat100g: Number(values.fat100g),
          min: parseOptionalNumber(values.min),
          max: parseOptionalNumber(values.max),
          mandatory: parseOptionalNumber(values.mandatory),
          indivisible: parseOptionalNumber(values.indivisible),
        } as const;

        const hasName = Boolean(payload.name);
        const macros = [
          payload.carbo100g,
          payload.protein100g,
          payload.fat100g,
        ];
        const hasValidMacros = macros.every((value) => Number.isFinite(value));

        if (!hasName || !hasValidMacros) {
          setError("Name and macronutrients are required");
          setSaving(false);
          return;
        }

        const created = await createIngredient(token, payload);
        setIngredients((prev) =>
          sortIngredients([...prev, toClientIngredient(created, true)])
        );
        ingredientModal.onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to create ingredient";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [ingredientModal.onClose, sortIngredients, token]
  );

  const downloadJson = useCallback((data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleMealsExport = useCallback(() => {
    if (!meals.length) return;
    const payload = meals.map((meal) => ({
      name: meal.name,
      carbo: meal.carbo,
      protein: meal.protein,
      fat: meal.fat,
    }));
    downloadJson(payload, "meals.json");
  }, [downloadJson, meals]);

  const handleIngredientsExport = useCallback(() => {
    if (!ingredients.length) return;
    const payload = ingredients.map((ingredient) => ({
      name: ingredient.name,
      carbo100g: ingredient.carbo100g,
      protein100g: ingredient.protein100g,
      fat100g: ingredient.fat100g,
      ...(ingredient.min != null ? { min: ingredient.min } : {}),
      ...(ingredient.max != null ? { max: ingredient.max } : {}),
      ...(ingredient.mandatory != null
        ? { mandatory: ingredient.mandatory }
        : {}),
      ...(ingredient.indivisible != null
        ? { indivisible: ingredient.indivisible }
        : {}),
    }));
    downloadJson(payload, "ingredients.json");
  }, [downloadJson, ingredients]);

  const handleMealsImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!token) return;
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;

      try {
        setSaving(true);
        setError(null);
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid meals file format");
        }

        const normalized = parsed.map((entry, index) => {
          if (typeof entry !== "object" || entry === null) {
            throw new Error(`Invalid meal entry at index ${index}`);
          }
          const raw = entry as Record<string, unknown>;
          const name = typeof raw.name === "string" ? raw.name.trim() : "";
          const carbo = Number(raw.carbo);
          const protein = Number(raw.protein);
          const fat = Number(raw.fat);

          if (
            !name ||
            !Number.isFinite(carbo) ||
            !Number.isFinite(protein) ||
            !Number.isFinite(fat)
          ) {
            throw new Error(`Invalid meal entry at index ${index}`);
          }

          return { name, carbo, protein, fat };
        });

        const created = await Promise.all(
          normalized.map((payload) => createMeal(token, payload))
        );
        setMeals((prev) => [...prev, ...created]);
        setSelectedMealId((prev) => prev ?? created[0]?.id ?? prev);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to import meals";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [sortIngredients, token]
  );

  const handleIngredientsImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!token) return;
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (!file) return;

      const parseOptional = (value: unknown) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };

      try {
        setSaving(true);
        setError(null);
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid ingredients file format");
        }

        const normalized = parsed.map((entry, index) => {
          if (typeof entry !== "object" || entry === null) {
            throw new Error(`Invalid ingredient entry at index ${index}`);
          }
          const raw = entry as Record<string, unknown>;
          const name = typeof raw.name === "string" ? raw.name.trim() : "";
          const carbo100g = Number(raw.carbo100g);
          const protein100g = Number(raw.protein100g);
          const fat100g = Number(raw.fat100g);
          const min = parseOptional(raw.min);
          const max = parseOptional(raw.max);
          const mandatory = parseOptional(raw.mandatory);
          const indivisible = parseOptional(raw.indivisible);

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
            indivisible,
          };
        });

        const created = await Promise.all(
          normalized.map((payload) =>
            createIngredient(token, {
              name: payload.name,
              carbo100g: payload.carbo100g,
              protein100g: payload.protein100g,
              fat100g: payload.fat100g,
              min: payload.min,
              max: payload.max,
              mandatory: payload.mandatory,
              indivisible: payload.indivisible,
            })
          )
        );
        setIngredients((prev) =>
          sortIngredients([
            ...prev,
            ...created.map((item) => toClientIngredient(item)),
          ])
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to import ingredients";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [sortIngredients, token]
  );

  const handleIngredientUpdate = useCallback(
    async (values: IngredientModalValues) => {
      if (!token || !editingIngredient) return;

      const currentIngredient = editingIngredient;

      try {
        setSaving(true);
        setError(null);
        const payload = {
          name: values.name.trim(),
          carbo100g: Number(values.carbo100g),
          protein100g: Number(values.protein100g),
          fat100g: Number(values.fat100g),
          min: parseOptionalNumber(values.min),
          max: parseOptionalNumber(values.max),
          mandatory: parseOptionalNumber(values.mandatory),
          indivisible: parseOptionalNumber(values.indivisible),
          sequence: currentIngredient.sequence,
        } as const;

        const hasName = Boolean(payload.name);
        const macros = [
          payload.carbo100g,
          payload.protein100g,
          payload.fat100g,
        ];
        const hasValidMacros = macros.every((value) => Number.isFinite(value));

        if (!hasName || !hasValidMacros) {
          setError("Name and macronutrients are required");
          setSaving(false);
          return;
        }

        const updated = await updateIngredient(
          token,
          currentIngredient.id,
          payload
        );
        setIngredients((prev) =>
          sortIngredients(
            prev.map((item) =>
              item.id === updated.id
                ? toClientIngredient(updated, item.included)
                : item
            )
          )
        );
        setEditingIngredient(null);
        editIngredientModal.onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update ingredient";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [editIngredientModal.onClose, editingIngredient, sortIngredients, token]
  );

  const handleIngredientToggle = useCallback(
    (ingredientId: string, included: boolean) => {
      setIngredients((prev) =>
        prev.map((item) =>
          item.id === ingredientId ? { ...item, included } : item
        )
      );
    },
    []
  );

  const handleResetIngredients = useCallback(() => {
    setIngredients((prev) =>
      prev.map((item) => ({ ...item, included: false }))
    );
  }, []);

  const triggerMealsImport = useCallback(() => {
    mealImportInputRef.current?.click();
  }, []);

  const triggerIngredientsImport = useCallback(() => {
    ingredientImportInputRef.current?.click();
  }, []);

  const persistIngredientOrder = useCallback(
    async (orderedList: ClientIngredient[]) => {
      if (!token) return;
      try {
        setSaving(true);
        await Promise.all(
          orderedList.map((ingredient) =>
            updateIngredient(token, ingredient.id, {
              sequence: ingredient.sequence,
            })
          )
        );
        setIngredients((prev) => sortIngredients(prev));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to update ingredient order";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [sortIngredients, token]
  );

  const handleIngredientReorder = useCallback(
    (sourceId: string, targetId: string | null) => {
      const list = [...ingredients];
      const sourceIndex = list.findIndex((item) => item.id === sourceId);
      if (sourceIndex === -1) {
        return;
      }

      const targetIndexBeforeRemoval = targetId
        ? list.findIndex((item) => item.id === targetId)
        : list.length;

      if (targetId && targetIndexBeforeRemoval === -1) {
        return;
      }

      const removed = list.splice(sourceIndex, 1);
      const moved = removed[0];
      if (!moved) {
        return;
      }

      let insertIndex =
        targetId === null ? list.length : targetIndexBeforeRemoval;
      if (targetId !== null && targetIndexBeforeRemoval > sourceIndex) {
        insertIndex = Math.max(0, insertIndex - 1);
      }

      list.splice(insertIndex, 0, moved);

      const next = list.map((item, index) => ({ ...item, sequence: index }));
      setIngredients(next);
      void persistIngredientOrder(next);
    },
    [ingredients, persistIngredientOrder]
  );

  const handleMealCreate = useCallback(
    async (values: MealModalValues) => {
      if (!token) return;

      try {
        setSaving(true);
        setError(null);
        const payload = {
          name: values.name.trim(),
          carbo: Number(values.carbo),
          protein: Number(values.protein),
          fat: Number(values.fat),
        } as const;

        const hasName = Boolean(payload.name);
        const macros = [payload.carbo, payload.protein, payload.fat];
        const hasValidMacros = macros.every((value) => Number.isFinite(value));

        if (!hasName || !hasValidMacros) {
          setError("Name and macro targets are required");
          setSaving(false);
          return;
        }

        const created = await createMeal(token, payload);
        setMeals((prev) => [...prev, created]);
        setSelectedMealId((prev) => prev ?? created.id);
        mealModal.onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save meal";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [mealModal.onClose, token]
  );

  const handleMealUpdate = useCallback(
    async (values: MealModalValues) => {
      if (!token || !editingMeal) return;

      try {
        setSaving(true);
        setError(null);
        const payload = {
          name: values.name.trim(),
          carbo: Number(values.carbo),
          protein: Number(values.protein),
          fat: Number(values.fat),
        } as const;

        const hasName = Boolean(payload.name);
        const macros = [payload.carbo, payload.protein, payload.fat];
        const hasValidMacros = macros.every((value) => Number.isFinite(value));

        if (!hasName || !hasValidMacros) {
          setError("Name and macro targets are required");
          setSaving(false);
          return;
        }

        const updated = await updateMeal(token, editingMeal.id, payload);
        setMeals((prev) =>
          prev.map((meal) => (meal.id === updated.id ? updated : meal))
        );
        setEditingMeal(null);
        editMealModal.onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save meal";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [editMealModal.onClose, editingMeal, token]
  );

  const handleCalculate = useCallback(() => {
    resultsModal.onClose();

    if (!selectedMeal) {
      toast.warn("Please create or select a meal to calculate.", {
        position: "top-center",
        autoClose: 6000,
        closeOnClick: true,
        draggable: true,
      });
      return;
    }

    const activeIngredients = ingredients.filter(
      (ingredient) => ingredient.included
    );
    if (!activeIngredients.length) {
      toast.warn(
        "Please include at least one ingredient to run the optimizer.",
        {
          position: "top-center",
          autoClose: 6000,
          closeOnClick: true,
          draggable: true,
        }
      );
      return;
    }

    try {
      const target = targetFromMeal(selectedMeal);
      const optimizerInput = activeIngredients.map((ingredient) => {
        const min = toOptionalBound(ingredient.min);
        const max = toOptionalBound(ingredient.max);
        const mandatory = toOptionalBound(ingredient.mandatory);
        const indivisible = ingredient.indivisible ?? undefined;

        return {
          name: ingredient.name,
          carbo100g: ingredient.carbo100g,
          protein100g: ingredient.protein100g,
          fat100g: ingredient.fat100g,
          ...(min !== undefined ? { min } : {}),
          ...(max !== undefined ? { max } : {}),
          ...(mandatory !== undefined ? { mandatory } : {}),
          ...(indivisible !== undefined ? { indivisible } : {}),
        };
      });

      const result = optimizeMealToMacro(target, optimizerInput);

      const totalWeight = result.ingredients.reduce(
        (sum, row) => sum + row.weight,
        0
      );
      const targetKcal = target.carbo * 4 + target.protein * 4 + target.fat * 9;
      const deviationKcal =
        targetKcal === 0
          ? 0
          : ((result.total.kcal - targetKcal) / targetKcal) * 100;

      setCalculation({
        targetName: target.name,
        targetCarbo: target.carbo,
        targetProtein: target.protein,
        targetFat: target.fat,
        targetKcal,
        rows: result.ingredients,
        totalWeight,
        totalCarbo: result.total.carbo,
        totalProtein: result.total.protein,
        totalFat: result.total.fat,
        totalKcal: result.total.kcal,
        deviationCarbo: result.deviation.carbo,
        deviationProtein: result.deviation.protein,
        deviationFat: result.deviation.fat,
        deviationKcal,
      });
      resultsModal.onOpen();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to calculate meal";
      toast.warn(message, {
        position: "top-center",
        autoClose: 6000,
        closeOnClick: true,
        draggable: true,
      });
      setCalculation(null);
    }
  }, [ingredients, resultsModal.onClose, resultsModal.onOpen, selectedMeal]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handleCalculate();
      }
    };

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [handleCalculate]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_SELECTED_MEAL_KEY);
    }
    logout();
  };

  const handleSelectMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_SELECTED_MEAL_KEY, mealId);
    }
  };

  const handleCloseEditMeal = () => {
    setEditingMeal(null);
    editMealModal.onClose();
  };

  const editingMealValues = editingMeal
    ? {
        name: editingMeal.name,
        carbo: String(editingMeal.carbo),
        protein: String(editingMeal.protein),
        fat: String(editingMeal.fat),
      }
    : undefined;

  const editingIngredientValues = editingIngredient
    ? {
        name: editingIngredient.name,
        carbo100g: String(editingIngredient.carbo100g),
        protein100g: String(editingIngredient.protein100g),
        fat100g: String(editingIngredient.fat100g),
        min: editingIngredient.min != null ? String(editingIngredient.min) : "",
        max: editingIngredient.max != null ? String(editingIngredient.max) : "",
        mandatory:
          editingIngredient.mandatory != null
            ? String(editingIngredient.mandatory)
            : "",
        indivisible:
          editingIngredient.indivisible != null
            ? String(editingIngredient.indivisible)
            : "",
      }
    : undefined;

  const calculateDisabled =
    loading || saving || !selectedMeal || !hasIncludedIngredients;

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      <ToastContainer
        position="top-center"
        autoClose={6000}
        hideProgressBar
        closeOnClick
        pauseOnHover={false}
      />

      <HeaderSection username={user?.username} onLogout={handleLogout} />

      {error && (
        <Box
          bg="red.100"
          color="red.700"
          borderRadius="md"
          px={4}
          py={3}
          mb={6}
        >
          {error}
        </Box>
      )}

      <Stack gap={6} mb={10}>
        <MealsPanel
          meals={meals}
          loading={loading}
          selectedMealId={selectedMealId}
          onSelectMeal={handleSelectMeal}
          onAddMeal={() => {
            setEditingMeal(null);
            mealModal.onOpen();
          }}
          onEditMeal={(meal) => {
            setEditingMeal(meal);
            editMealModal.onOpen();
          }}
          onImportMeals={triggerMealsImport}
          onExportMeals={handleMealsExport}
        />
        <IngredientList
          ingredients={ingredients}
          loading={loading}
          saving={saving}
          onFieldChange={handleIngredientFieldChange}
          onFieldCommit={handleIngredientFieldCommit}
          onToggleInclude={handleIngredientToggle}
          onEdit={(ingredient) => {
            setEditingIngredient(ingredient);
            editIngredientModal.onOpen();
          }}
          onAddIngredient={ingredientModal.onOpen}
          onImportIngredients={triggerIngredientsImport}
          onExportIngredients={handleIngredientsExport}
          onResetIncludes={handleResetIngredients}
          onReorder={handleIngredientReorder}
        />
      </Stack>

      <Button
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        right={{ base: 4, md: 6 }}
        colorScheme="teal"
        onClick={handleCalculate}
        disabled={calculateDisabled}
        loading={saving}
        zIndex="tooltip"
        size="lg"
        borderRadius="full"
        boxShadow="lg"
      >
        Calculate
      </Button>

      <IngredientModal
        open={ingredientModal.open}
        title="Add ingredient"
        isSubmitting={saving}
        onClose={ingredientModal.onClose}
        onSubmit={handleIngredientCreate}
      />

      <IngredientModal
        open={editIngredientModal.open}
        title="Edit ingredient"
        isSubmitting={saving}
        onClose={() => {
          setEditingIngredient(null);
          editIngredientModal.onClose();
        }}
        onSubmit={handleIngredientUpdate}
        initialValues={editingIngredientValues}
      />

      <MealModal
        open={mealModal.open}
        title="Add meal"
        isSubmitting={saving}
        onClose={mealModal.onClose}
        onSubmit={handleMealCreate}
      />

      <MealModal
        open={editMealModal.open}
        title="Edit meal"
        isSubmitting={saving}
        onClose={handleCloseEditMeal}
        onSubmit={handleMealUpdate}
        initialValues={editingMealValues}
      />

      <ResultsModal
        open={resultsModal.open}
        calculation={calculation}
        onClose={resultsModal.onClose}
      />

      <input
        ref={mealImportInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleMealsImport}
      />
      <input
        ref={ingredientImportInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleIngredientsImport}
      />
    </Box>
  );
}

export default HomePage;
