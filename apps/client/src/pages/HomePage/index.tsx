import { optimizeMealToMacro } from "@macro-calculator/shared";
import {
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Stack,
  Text,
  chakra,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import { IngredientModal } from "../../features/macro/components/IngredientModal";
import { MealModal } from "../../features/macro/components/MealModal";
import { ResultsCard } from "../../features/macro/components/ResultsCard";
import { useMacroData } from "../../features/macro/MacroDataProvider";
import type {
  CalculationState,
  ClientIngredient,
  IngredientModalValues,
  MealModalValues,
} from "../../features/macro/types";
import {
  buildIngredientInitialState,
  buildMealInitialState,
  toOptionalBound,
} from "../../features/macro/utils";
import { targetFromMeal } from "../../lib/api-client";
import type { ApiMeal } from "../../types/api";
import { useTranslation } from "react-i18next";

const Label = chakra("span");
const StyledSelect = chakra("select");

const FIELD_HELP_TEXT: Record<
  "min" | "max" | "mandatory" | "indivisible",
  string
> = {
  min: "Smallest amount you are willing to use for this ingredient.",
  max: "Maximum grams allowed in the calculation.",
  mandatory:
    "Exact grams that must be included when this ingredient is selected.",
  indivisible:
    "Granularity for this ingredient (e.g. 5 means multiples of 5g).",
};

function IngredientRow({
  ingredient,
  onFieldChange,
  onFieldCommit,
  onRemove,
  onEdit,
  saving,
}: {
  ingredient: ClientIngredient;
  onFieldChange: (
    field: "min" | "max" | "mandatory" | "indivisible",
    value: string
  ) => void;
  onFieldCommit: (
    field: "min" | "max" | "mandatory" | "indivisible",
    value: string
  ) => void;
  onRemove: () => void;
  onEdit: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleChange =
    (field: "min" | "max" | "mandatory" | "indivisible") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onFieldChange(field, event.currentTarget.value);
    };

  const handleBlur =
    (field: "min" | "max" | "mandatory" | "indivisible") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onFieldCommit(field, event.currentTarget.value);
    };

  return (
    <Box
      key={ingredient.id}
      bg="app.surfaceMuted"
      borderRadius="lg"
      border="1px solid rgba(148, 163, 184, 0.12)"
      p={{ base: 4, md: 5 }}
      transition="all 0.2s ease"
      _hover={{
        borderColor: "app.accentMuted",
        boxShadow: "0 14px 30px rgba(4, 6, 12, 0.35)",
      }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        gap={3}
        mb={3}
      >
        <Stack gap={1}>
          <Text fontWeight="semibold" fontSize="lg">
            {ingredient.name}
          </Text>
          <Text color="app.textMuted" fontSize="sm">
            {ingredient.carbo100g}g carbs · {ingredient.protein100g}g protein ·{" "}
            {ingredient.fat100g}g fat
          </Text>
        </Stack>
        <Flex gap={2} wrap="wrap">
          <Button
            variant="outline"
            size="sm"
            borderColor="app.accent"
            color="app.accent"
            _hover={{ bg: "rgba(94, 234, 212, 0.12)" }}
            onClick={onEdit}
          >
            {t("Edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            color="app.error"
            opacity={saving ? 0.7 : 1}
            onClick={onRemove}
            _hover={{ bg: "rgba(248, 113, 113, 0.12)" }}
          >
            {t("Remove")}
          </Button>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        {(["min", "max", "mandatory", "indivisible"] as const).map((field) => {
          const labelCopy =
            field === "min"
              ? t("Minimum (g)")
              : field === "max"
              ? t("Maximum (g)")
              : field === "mandatory"
              ? t("Mandatory (g)")
              : t("Indivisible (g)");

          return (
            <Box key={field} position="relative">
              <Flex align="center" justify="space-between" gap={2}>
                <Label
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  color="app.textMuted"
                >
                  {labelCopy}
                </Label>
                <chakra.button
                  type="button"
                  aria-label={`${labelCopy} help`}
                  color="app.textMuted"
                  cursor="help"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                  border="1px solid rgba(148, 163, 184, 0.5)"
                  borderRadius="full"
                  w="18px"
                  h="18px"
                  fontWeight="bold"
                  bg="transparent"
                  onMouseEnter={() => setActiveTooltip(field)}
                  onMouseLeave={() =>
                    setActiveTooltip((prev) => (prev === field ? null : prev))
                  }
                  onFocus={() => setActiveTooltip(field)}
                  onBlur={() =>
                    setActiveTooltip((prev) => (prev === field ? null : prev))
                  }
                  onClick={() =>
                    setActiveTooltip((prev) => (prev === field ? null : field))
                  }
                >
                  ?
                </chakra.button>
              </Flex>
              {activeTooltip === field && (
                <Box
                  position="absolute"
                  right={0}
                  top="calc(100% + 6px)"
                  maxW="220px"
                  bg="rgba(21, 24, 38, 0.95)"
                  color="rgba(245, 247, 255, 0.92)"
                  border="1px solid rgba(94, 234, 212, 0.18)"
                  borderRadius="md"
                  px={3}
                  py={2}
                  fontSize="xs"
                  boxShadow="0 12px 24px rgba(6, 18, 22, 0.45)"
                  zIndex="tooltip"
                >
                  {t(FIELD_HELP_TEXT[field])}
                </Box>
              )}
              <Input
                mt={2}
                type="number"
                value={
                  ingredient[field] != null && ingredient[field] !== undefined
                    ? String(ingredient[field])
                    : ""
                }
                onChange={handleChange(field)}
                onBlur={handleBlur(field)}
                bg="app.surface"
                borderColor="whiteAlpha.200"
                _focusVisible={{
                  borderColor: "app.accent",
                  boxShadow: "0 0 0 1px rgba(94, 234, 212, 0.35)",
                }}
              />
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function MealSummary({ meal }: { meal: ApiMeal | null }) {
  const { t } = useTranslation();
  
  if (!meal) {
    return (
      <Box
        bg="rgba(148, 163, 184, 0.08)"
        border="1px dashed rgba(148, 163, 184, 0.24)"
        borderRadius="lg"
        px={4}
        py={3}
        textAlign="center"
      >
        <Text color="app.textMuted" fontSize="sm">
          {t("Create a meal target to start planning.")}
        </Text>
      </Box>
    );
  }

  const totalKcal = meal.carbo * 4 + meal.protein * 4 + meal.fat * 9;

  return (
    <Box
      bg="app.surfaceMuted"
      border="1px solid rgba(148, 163, 184, 0.12)"
      borderRadius="lg"
      px={4}
      py={{ base: 3, md: 4 }}
    >
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        wrap="wrap"
        gap={3}
      >
        <Stack gap={0}>
          <Text fontWeight="medium">{meal.name}</Text>
          <Text color="app.textMuted" fontSize="sm">
            {meal.carbo}g carbs · {meal.protein}g protein · {meal.fat}g fat
          </Text>
        </Stack>
        <Text
          fontSize="sm"
          color="app.accent"
          fontWeight="semibold"
          bg="rgba(94, 234, 212, 0.12)"
          px={3}
          py={1}
          borderRadius="full"
        >
          {totalKcal.toFixed(0)} {t("kcal target")}
        </Text>
      </Flex>
    </Box>
  );
}

export default function HomePage() {
  const {
    meals,
    ingredients,
    includedIngredients,
    selectedMealId,
    selectedMeal,
    loading,
    saving,
    selectMeal,
    createMeal,
    updateMeal,
    deleteMeal,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    toggleIngredientInclude,
    setIngredientFieldValue,
    commitIngredientFieldValue,
  } = useMacroData();

  const mealModal = useDisclosure();
  const editMealModal = useDisclosure();
  const ingredientModal = useDisclosure();
  const editIngredientModal = useDisclosure();
  const { t } = useTranslation();

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [calculation, setCalculation] = useState<CalculationState | null>(null);
  const [editingMeal, setEditingMeal] = useState<ApiMeal | null>(null);
  const [editingIngredient, setEditingIngredient] =
    useState<ClientIngredient | null>(null);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const normalizedSearch = search.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }
    return ingredients
      .filter(
        (ingredient) =>
          !ingredient.included &&
          ingredient.name.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 8);
  }, [ingredients, normalizedSearch]);

  useEffect(() => {
    if (!suggestions.length) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex((prev) => {
      if (prev < 0 || prev >= suggestions.length) {
        return 0;
      }
      return prev;
    });
  }, [suggestions]);

  const handleSuggestionClick = useCallback(
    (ingredientId: string) => {
      toggleIngredientInclude(ingredientId, true);
      setSearch("");
      setHighlightedIndex(0);
    },
    [toggleIngredientInclude]
  );

  const handleSuggestionKeys = (
    event: ReactKeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!suggestions.length) return;
      setHighlightedIndex((prev) => {
        if (prev === -1 || prev >= suggestions.length - 1) {
          return 0;
        }
        return prev + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestions.length) return;
      setHighlightedIndex((prev) => {
        if (prev <= 0) {
          return suggestions.length - 1;
        }
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter" && suggestions.length > 0) {
      event.preventDefault();
      const selected =
        highlightedIndex >= 0 && highlightedIndex < suggestions.length
          ? suggestions[highlightedIndex]
          : suggestions[0];
      if (selected) {
        handleSuggestionClick(selected.id);
      }
      return;
    }

    if (event.key === "Escape") {
      setSearch("");
      setHighlightedIndex(0);
    }
  };

  const handleCalculate = useCallback(() => {
    if (!selectedMeal) {
      toast.warn(t("Please create or select a meal to calculate."));
      return;
    }

    if (!includedIngredients.length) {
      toast.warn(
        t("Please include at least one ingredient to run the optimizer.")
      );
      return;
    }

    try {
      const target = targetFromMeal(selectedMeal);
      const optimizerInput = includedIngredients.map((ingredient) => {
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("Unable to calculate meal");
      toast.warn(message);
      setCalculation(null);
    }
  }, [includedIngredients, selectedMeal, t]);

  useEffect(() => {
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

  const handleMealCreate = async (values: MealModalValues) => {
    await createMeal(values);
    mealModal.onClose();
  };

  const handleMealUpdate = async (values: MealModalValues) => {
    if (!editingMeal) return;
    await updateMeal(editingMeal.id, values);
    setEditingMeal(null);
    editMealModal.onClose();
  };

  const handleMealDelete = async () => {
    if (!editingMeal) return;
    await deleteMeal(editingMeal.id);
    setEditingMeal(null);
    editMealModal.onClose();
  };

  const handleIngredientCreate = async (values: IngredientModalValues) => {
    await createIngredient(values);
    ingredientModal.onClose();
  };

  const handleIngredientUpdate = async (values: IngredientModalValues) => {
    if (!editingIngredient) return;
    await updateIngredient(editingIngredient.id, values);
    setEditingIngredient(null);
    editIngredientModal.onClose();
  };

  const handleIngredientDelete = async () => {
    if (!editingIngredient) return;
    await deleteIngredient(editingIngredient.id);
    setEditingIngredient(null);
    editIngredientModal.onClose();
  };

  const calculateDisabled =
    loading || saving || !selectedMeal || !includedIngredients.length;

  useEffect(() => {
    if (calculation && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [calculation]);

  return (
    <>
      <Stack gap={{ base: 6, md: 8 }}>
        <Box
          bg="app.surface"
          borderRadius="card"
          border="1px solid rgba(94, 234, 212, 0.12)"
          boxShadow="card"
          p={{ base: 5, md: 6 }}
        >
          <Flex
            justify="space-between"
            align={{ base: "flex-start", sm: "center" }}
            mb={5}
            gap={3}
          >
            <Stack gap={0}>
              <Text fontSize="lg" fontWeight="semibold">
                {t("Meal target")}
              </Text>
              <Text color="app.textMuted" fontSize="sm">
                {t("Choose the macro goal you want to optimize for.")}
              </Text>
            </Stack>
            <Flex gap={2} wrap="wrap">
              <Button
                size="sm"
                variant="outline"
                borderColor="app.accent"
                color="app.accent"
                _hover={{ bg: "rgba(94, 234, 212, 0.12)" }}
                onClick={() => {
                  if (!selectedMeal) return;
                  setEditingMeal(selectedMeal);
                  editMealModal.onOpen();
                }}
                disabled={!selectedMeal}
              >
                {t("Edit meal")}
              </Button>
              <Button
                size="sm"
                bg="app.accent"
                color="#061216"
                _hover={{ bg: "app.accentMuted" }}
                onClick={mealModal.onOpen}
              >
                {t("Add meal")}
              </Button>
            </Flex>
          </Flex>

          <Stack gap={4}>
            <Box>
              <Label
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.08em"
                color="app.textMuted"
                mr={4}
              >
                {t("Select meal")}
              </Label>
              <StyledSelect
                mt={2}
                value={selectedMealId ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  selectMeal(event.currentTarget.value || null)
                }
                bg="app.surfaceMuted"
                borderColor="whiteAlpha.200"
                _focusVisible={{
                  borderColor: "app.accent",
                  boxShadow: "0 0 0 1px rgba(94, 234, 212, 0.35)",
                }}
                borderRadius="md"
                py={2}
                px={3}
                color="inherit"
              >
                <option
                  value=""
                  disabled={!meals.length}
                  hidden={!meals.length}
                >
                  {meals.length
                    ? t("Select a meal target")
                    : t("Create a meal to begin")}
                </option>
                {meals.map((meal) => (
                  <option key={meal.id} value={meal.id}>
                    {meal.name}
                  </option>
                ))}
              </StyledSelect>
            </Box>
            <MealSummary meal={selectedMeal ?? null} />
          </Stack>
        </Box>

        <Box
          bg="app.surface"
          borderRadius="card"
          border="1px solid rgba(94, 234, 212, 0.12)"
          boxShadow="card"
          p={{ base: 5, md: 6 }}
        >
          <Flex
            justify="space-between"
            align={{ base: "flex-start", sm: "center" }}
            mb={5}
            gap={3}
          >
            <Stack gap={0}>
              <Text fontSize="lg" fontWeight="semibold">
                {t("Ingredients")}
              </Text>
              <Text color="app.textMuted" fontSize="sm">
                {t("Autocomplete ingredients and fine-tune the constraints.")}
              </Text>
            </Stack>
            <Flex gap={2} wrap="wrap">
              <Button
                size="sm"
                variant="outline"
                borderColor="app.accent"
                color="app.accent"
                _hover={{ bg: "rgba(94, 234, 212, 0.12)" }}
                onClick={() => {
                  setSearch("");
                  includedIngredients.forEach((ingredient) =>
                    toggleIngredientInclude(ingredient.id, false)
                  );
                }}
                disabled={!includedIngredients.length}
              >
                {t("Reset list")}
              </Button>
              <Button
                size="sm"
                bg="app.accent"
                color="#061216"
                _hover={{ bg: "app.accentMuted" }}
                onClick={ingredientModal.onOpen}
              >
                {t("Add ingredient")}
              </Button>
            </Flex>
          </Flex>

          <Box position="relative">
            <Input
              placeholder={t("Search all ingredients") as string}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onKeyDown={handleSuggestionKeys}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{
                borderColor: "app.accent",
                boxShadow: "0 0 0 1px rgba(94, 234, 212, 0.35)",
              }}
            />
            {normalizedSearch && suggestions.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                bg="app.surfaceActive"
                border="1px solid rgba(94, 234, 212, 0.16)"
                borderRadius="lg"
                mt={2}
                zIndex="dropdown"
                maxH="240px"
                overflowY="auto"
              >
                {suggestions.map((suggestion, index) => (
                  <Box
                    key={suggestion.id}
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={
                      index === highlightedIndex
                        ? "rgba(94, 234, 212, 0.12)"
                        : "transparent"
                    }
                    _hover={{ bg: "rgba(94, 234, 212, 0.12)" }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSuggestionClick(suggestion.id);
                    }}
                  >
                    <Text fontWeight="medium">{suggestion.name}</Text>
                    <Text fontSize="xs" color="app.textMuted">
                      {suggestion.carbo100g}g carbs · {suggestion.protein100g}g
                      protein · {suggestion.fat100g}g fat
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Stack mt={6} gap={4}>
            {includedIngredients.length === 0 ? (
              <Box
                bg="rgba(148, 163, 184, 0.08)"
                border="1px dashed rgba(148, 163, 184, 0.24)"
                borderRadius="lg"
                px={4}
                py={5}
                textAlign="center"
              >
                <Text color="app.textMuted" fontSize="sm">
                  {t("Include ingredients to start composing your meal. Newly added ingredients are included automatically.")}
                </Text>
              </Box>
            ) : (
              includedIngredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  saving={saving}
                  onFieldChange={(field, value) =>
                    setIngredientFieldValue(ingredient.id, field, value)
                  }
                  onFieldCommit={(field, value) =>
                    commitIngredientFieldValue(ingredient.id, field, value)
                  }
                  onRemove={() => toggleIngredientInclude(ingredient.id, false)}
                  onEdit={() => {
                    setEditingIngredient(ingredient);
                    editIngredientModal.onOpen();
                  }}
                />
              ))
            )}
          </Stack>
        </Box>

        {calculation && (
          <Box ref={resultsRef}>
            <ResultsCard
              calculation={calculation}
              onClose={() => setCalculation(null)}
            />
          </Box>
        )}

        <MealModal
          open={mealModal.open}
          title={t("Add meal")}
          isSubmitting={saving}
          onClose={mealModal.onClose}
          onSubmit={handleMealCreate}
        />

        <MealModal
          open={editMealModal.open}
          title={t("Edit meal")}
          isSubmitting={saving}
          onClose={() => {
            setEditingMeal(null);
            editMealModal.onClose();
          }}
          onSubmit={handleMealUpdate}
          initialValues={
            editingMeal ? buildMealInitialState(editingMeal) : undefined
          }
          onDelete={handleMealDelete}
          isDeleting={saving}
        />

        <IngredientModal
          open={ingredientModal.open}
          title={t("Add ingredient")}
          isSubmitting={saving}
          onClose={ingredientModal.onClose}
          onSubmit={handleIngredientCreate}
        />

        <IngredientModal
          open={editIngredientModal.open}
          title={t("Edit ingredient")}
          isSubmitting={saving}
          onClose={() => {
            setEditingIngredient(null);
            editIngredientModal.onClose();
          }}
          onSubmit={handleIngredientUpdate}
          initialValues={
            editingIngredient
              ? buildIngredientInitialState(editingIngredient)
              : undefined
          }
          onDelete={handleIngredientDelete}
          isDeleting={saving}
        />
      </Stack>

      <Button
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        right={{ base: 4, md: 6 }} 
        size={{ base: "md", md: "lg" }}
        bg="#5eead4"
        _hover={{
          bg: "#5eead4",
          transform: "translateY(-1px)",
          boxShadow: "0 10px 22px rgba(94, 234, 212, 0.25)",
        }}
        color="#061216"
        onClick={handleCalculate}
        loading={saving}
        disabled={calculateDisabled}
        borderRadius="full"
        boxShadow="0 18px 40px rgba(6, 18, 22, 0.35)"
        zIndex="tooltip"
      >
        {t("Calculate")}
      </Button>
    </>
  );
}
