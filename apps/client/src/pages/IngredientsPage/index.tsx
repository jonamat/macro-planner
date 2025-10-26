import { Box, Button, Flex, Grid, GridItem, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { IngredientModal } from '../../features/macro/components/IngredientModal';
import { useMacroData } from '../../features/macro/MacroDataProvider';
import {
  buildIngredientInitialState,
  parseIngredientsJson
} from '../../features/macro/utils';
import type { ClientIngredient } from '../../features/macro/types';

export default function IngredientsPage() {
  const { t } = useTranslation();
  const {
    ingredients,
    saving,
    loading,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    importIngredients,
    exportIngredients
  } = useMacroData();

  const addIngredientModal = useDisclosure();
  const editIngredientModal = useDisclosure();
  const [editingIngredient, setEditingIngredient] = useState<ClientIngredient | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const sortedIngredients = useMemo(
    () => [...ingredients].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [ingredients]
  );

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const payload = parseIngredientsJson(text);
      await importIngredients(payload);
      toast.success(t('Ingredients imported successfully'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Unable to import ingredients');
      toast.error(message);
    }
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
            {t("Ingredients catalog")}
          </Text>
          <Text color="app.textMuted" fontSize="sm">
            {t("Manage every ingredient available to the optimizer. Adjust macros and constraints.")}
          </Text>
        </Box>
        <Flex gap={3} wrap="wrap">
          <Button
            variant="outline"
            borderColor="app.accent"
            color="app.accent"
            _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
            size="sm"
            onClick={() => importInputRef.current?.click()}
          >
            {t("Import JSON")}
          </Button>
          <Button
            variant="outline"
            borderColor="app.accent"
            color="app.accent"
            _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
            size="sm"
            onClick={() => exportIngredients('all')}
          >
            {t("Export JSON")}
          </Button>
          <Button
            bg="app.accent"
            color="#061216"
            _hover={{ bg: 'app.accentMuted' }}
            size="sm"
            onClick={addIngredientModal.onOpen}
          >
            {t("Add ingredient")}
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
              {t("Loading ingredients...")}
            </Text>
          </Box>
        )}

        {!loading && sortedIngredients.length === 0 && (
          <Box
            bg="rgba(148, 163, 184, 0.08)"
            border="1px dashed rgba(148, 163, 184, 0.24)"
            borderRadius="lg"
            px={4}
            py={5}
            textAlign="center"
          >
            <Text color="app.textMuted" fontSize="sm">
              {t("No ingredients yet. Add your first ingredient to start planning meals.")}
            </Text>
          </Box>
        )}

        {sortedIngredients.map((ingredient) => (
          <Box
            key={ingredient.id}
            bg="app.surfaceMuted"
            borderRadius="lg"
            border="1px solid rgba(148, 163, 184, 0.16)"
            px={{ base: 4, md: 5 }}
            py={{ base: 4, md: 5 }}
          >
            <Grid
              templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }}
              gap={4}
              alignItems="center"
            >
              <GridItem>
                <Text fontWeight="semibold" fontSize="lg">
                  {ingredient.name}
                </Text>
                <Text color="app.textMuted" fontSize="sm">
                  {ingredient.carbo100g}c · {ingredient.protein100g}p · {ingredient.fat100g}f
                </Text>
              </GridItem>

              <GridItem>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="app.textMuted">
                  {t("Min / Max")}
                </Text>
                <Text mt={2}>
                  {ingredient.min ?? '—'} / {ingredient.max ?? '—'}
                </Text>
              </GridItem>

              <GridItem>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color="app.textMuted">
                  {t("Mandatory / Indivisible")}
                </Text>
                <Text mt={2}>
                  {ingredient.mandatory ?? '—'} / {ingredient.indivisible ?? '—'}
                </Text>
              </GridItem>

              <GridItem>
                <Flex justify={{ base: 'flex-start', md: 'flex-end' }} gap={2} flexWrap="wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="app.accent"
                    color="app.accent"
                    _hover={{ bg: 'rgba(94, 234, 212, 0.12)' }}
                    onClick={() => {
                      setEditingIngredient(ingredient);
                      editIngredientModal.onOpen();
                    }}
                  >
                    {t("Edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="app.error"
                    _hover={{ bg: 'rgba(248, 113, 113, 0.12)' }}
                    onClick={async () => {
                      await deleteIngredient(ingredient.id);
                    }}
                    loading={saving}
                  >
                    {t("Delete")}
                  </Button>
                </Flex>
              </GridItem>
            </Grid>
          </Box>
        ))}
      </Stack>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      <IngredientModal
        open={addIngredientModal.open}
        title={t("Add ingredient")}
        isSubmitting={saving}
        onClose={addIngredientModal.onClose}
        onSubmit={async (values) => {
          await createIngredient(values);
          addIngredientModal.onClose();
        }}
      />

      <IngredientModal
        open={editIngredientModal.open}
        title={t("Edit ingredient")}
        isSubmitting={saving}
        onClose={() => {
          setEditingIngredient(null);
          editIngredientModal.onClose();
        }}
        onSubmit={async (values) => {
          if (!editingIngredient) return;
          await updateIngredient(editingIngredient.id, values);
          setEditingIngredient(null);
          editIngredientModal.onClose();
        }}
        initialValues={editingIngredient ? buildIngredientInitialState(editingIngredient) : undefined}
        onDelete={async () => {
          if (!editingIngredient) return;
          await deleteIngredient(editingIngredient.id);
          setEditingIngredient(null);
          editIngredientModal.onClose();
        }}
        isDeleting={saving}
      />
    </Box>
  );
}
