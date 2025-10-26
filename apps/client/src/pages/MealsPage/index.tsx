import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { MealModal } from '../../features/macro/components/MealModal';
import { useMacroData } from '../../features/macro/MacroDataProvider';
import { buildMealInitialState, parseMealsJson } from '../../features/macro/utils';
import type { ApiMeal } from '../../types/api';

export default function MealsPage() {
  const { t } = useTranslation();
  const {
    meals,
    loading,
    saving,
    createMeal,
    updateMeal,
    deleteMeal,
    importMeals,
    exportMeals
  } = useMacroData();

  const addMealModal = useDisclosure();
  const editMealModal = useDisclosure();
  const [editingMeal, setEditingMeal] = useState<ApiMeal | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const sortedMeals = useMemo(
    () =>
      [...meals].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [meals]
  );

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const payload = parseMealsJson(text);
      await importMeals(payload);
      toast.success(t('Meals imported successfully'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Unable to import meals');
      toast.error(message);
    }
  };

  const handleMealCreate = async (values: Parameters<typeof createMeal>[0]) => {
    await createMeal(values);
    addMealModal.onClose();
  };

  const handleMealUpdate = async (values: Parameters<typeof updateMeal>[1]) => {
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

  return (
    <Box
      bg="app.surface"
      borderRadius="card"
      border="1px solid rgba(94, 234, 212, 0.12)"
      boxShadow="card"
      p={{ base: 5, md: 7 }}
    >
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4} mb={6}>
        <Box>
          <Text fontSize="xl" fontWeight="semibold">
            {t("Meals library")}
          </Text>
          <Text color="app.textMuted" fontSize="sm">
            {t("Maintain all your macro targets in one place. Import existing presets or create new ones.")}
          </Text>
        </Box>
        <Flex gap={3} wrap="wrap">
          <Button
            variant="outline"
            borderColor="app.accent"
            color="app.accent"
            _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
            onClick={() => importInputRef.current?.click()}
            size="sm"
          >
            {t("Import JSON")}
          </Button>
          <Button
            variant="outline"
            borderColor="app.accent"
            color="app.accent"
            _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
            onClick={exportMeals}
            size="sm"
          >
            {t("Export JSON")}
          </Button>
          <Button
            bg="app.accent"
            color="#061216"
            _hover={{ bg: 'app.accentMuted' }}
            size="sm"
            onClick={addMealModal.onOpen}
          >
            {t("Add meal")}
          </Button>
        </Flex>
      </Flex>

      <Stack gap={4}>
        {loading && (
          <Box
            bg="rgba(148, 163, 184, 0.08)"
            border="1px dashed rgba(148, 163, 184, 0.24)"
            borderRadius="lg"
            px={4}
            py={5}
            textAlign="center"
          >
            <Text color="app.textMuted" fontSize="sm">
              {t("Loading meals...")}
            </Text>
          </Box>
        )}

        {!loading && sortedMeals.length === 0 && (
          <Box
            bg="rgba(148, 163, 184, 0.08)"
            border="1px dashed rgba(148, 163, 184, 0.24)"
            borderRadius="lg"
            px={4}
            py={5}
            textAlign="center"
          >
            <Text color="app.textMuted" fontSize="sm">
              {t("No meals yet. Create your first macro target to begin planning.")}
            </Text>
          </Box>
        )}

        {sortedMeals.map((meal) => {
          const totalKcal = meal.carbo * 4 + meal.protein * 4 + meal.fat * 9;
          return (
            <Flex
              key={meal.id}
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              gap={4}
              bg="app.surfaceMuted"
              borderRadius="lg"
              border="1px solid rgba(148, 163, 184, 0.16)"
              px={{ base: 4, md: 5 }}
              py={{ base: 4, md: 5 }}
            >
              <Stack gap={1}>
                <Text fontWeight="semibold" fontSize="lg">
                  {meal.name}
                </Text>
                <Text color="app.textMuted" fontSize="sm">
                  {meal.carbo}g carbs · {meal.protein}g protein · {meal.fat}g fat
                </Text>
                <Text color="app.accent" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">
                  {totalKcal.toFixed(0)} kcal
                </Text>
              </Stack>
              <Flex gap={2} wrap="wrap">
                <Button
                  variant="outline"
                  size="sm"
                  borderColor="app.accent"
                  color="app.accent"
                  _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
                  onClick={() => {
                    setEditingMeal(meal);
                    editMealModal.onOpen();
                  }}
                >
                  {t("Edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  color="app.error"
                  _hover={{ bg: 'rgba(248, 113, 113, 0.12)' }}
                  onClick={async () => {
                    await deleteMeal(meal.id);
                    if (editingMeal?.id === meal.id) {
                      setEditingMeal(null);
                      editMealModal.onClose();
                    }
                  }}
                  loading={saving}
                >
                  {t("Delete")}
                </Button>
              </Flex>
            </Flex>
          );
        })}
      </Stack>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      <MealModal
        open={addMealModal.open}
        title={t("Add meal")}
        isSubmitting={saving}
        onClose={addMealModal.onClose}
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
        initialValues={editingMeal ? buildMealInitialState(editingMeal) : undefined}
        onDelete={handleMealDelete}
        isDeleting={saving}
      />
    </Box>
  );
}
