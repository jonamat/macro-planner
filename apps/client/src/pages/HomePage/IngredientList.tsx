import { Box, Button, Flex, Heading, IconButton, Input, Stack, Text, chakra } from '@chakra-ui/react';
import type { BoxProps, IconProps } from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';

import type { ClientIngredient, IngredientField } from './types';

const Label = chakra('label');
const CheckboxInput = chakra('input');
const PencilIcon = (props: IconProps) => (
  <chakra.svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92-9.06 9.06ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.34a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82Z" />
  </chakra.svg>
);

interface IngredientListProps {
  ingredients: ClientIngredient[];
  loading: boolean;
  saving: boolean;
  onFieldChange: (ingredientId: string, field: IngredientField, value: string) => void;
  onFieldCommit: (ingredient: ClientIngredient) => void;
  onToggleInclude: (ingredientId: string, included: boolean) => void;
  onEdit: (ingredient: ClientIngredient) => void;
  onAddIngredient: () => void;
  onImportIngredients: () => void;
  onExportIngredients: () => void;
  onResetIncludes: () => void;
  onReorder: (sourceId: string, targetId: string | null) => void;
  containerProps?: BoxProps;
}
export function IngredientList({
  ingredients,
  loading,
  saving,
  onFieldChange,
  onFieldCommit,
  onToggleInclude,
  onEdit,
  onAddIngredient,
  onImportIngredients,
  onExportIngredients,
  onResetIncludes,
  onReorder,
  containerProps
}: IngredientListProps) {
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragStart = (event: DragEvent<HTMLElement>, ingredientId: string) => {
    event.dataTransfer.setData('text/plain', ingredientId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCard = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    onReorder(sourceId, targetId);
  };

  const handleDropOnList = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (!sourceId) return;
    onReorder(sourceId, null);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      normalizedSearch.length === 0
        ? []
        : ingredients
            .filter((ingredient) =>
              !ingredient.included && ingredient.name.toLowerCase().includes(normalizedSearch)
            )
            .slice(0, 8),
    [ingredients, normalizedSearch]
  );

  const handleSelectSuggestion = (ingredientId: string) => {
    onToggleInclude(ingredientId, true);
    setSearch('');
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault();
      const firstSuggestion = suggestions[0];
      if (firstSuggestion) {
        handleSelectSuggestion(firstSuggestion.id);
      }
    }
    if (event.key === 'Escape') {
      setSearch('');
    }
  };

  return (
    <Box flex="1" bg="white" p={5} borderRadius="md" boxShadow="sm" {...containerProps}>
      <Flex justify="space-between" mb={4} align="center" wrap="wrap" gap={3}>
        <Heading size="md">Ingredients</Heading>
        <Flex gap={2} wrap="wrap" align="center">
          {saving && <Text fontSize="sm" color="gray.500">Saving...</Text>}
          <Button size="sm" variant="outline" onClick={onExportIngredients}>
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={onImportIngredients}>
            Import JSON
          </Button>
          <Button size="sm" variant="outline" onClick={onResetIncludes}>
            Reset
          </Button>
          <Button size="sm" colorScheme="teal" onClick={onAddIngredient}>
            Add Ingredient
          </Button>
        </Flex>
      </Flex>
      <Box position="relative" mb={4}>
        <Input
          ref={searchInputRef}
          placeholder="Search ingredients to include"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          onKeyDown={handleSearchKeyDown}
          data-testid="ingredient-quick-search"
        />
        {normalizedSearch.length > 0 && (
          <Box
            role="listbox"
            position="absolute"
            top="calc(100% + 4px)"
            left={0}
            right={0}
            bg="white"
            borderWidth="1px"
            borderRadius="md"
            boxShadow="md"
            maxH="240px"
            overflowY="auto"
            zIndex={10}
          >
            {suggestions.length === 0 ? (
              <Box px={3} py={2}>
                <Text fontSize="sm" color="gray.500">
                  No matching ingredients
                </Text>
              </Box>
            ) : (
              suggestions.map((ingredient) => (
                <Box
                  as="button"
                  key={ingredient.id}
                  type="button"
                  role="option"
                  w="100%"
                  textAlign="left"
                  px={3}
                  py={2}
                  _hover={{ bg: 'gray.100' }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelectSuggestion(ingredient.id);
                  }}
                >
                  <Text fontWeight="semibold">{ingredient.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {ingredient.carbo100g}g carbs • {ingredient.protein100g}g protein • {ingredient.fat100g}g fat
                  </Text>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
      {loading ? (
        <Flex justify="center" py={10}>
          <Text color="gray.500">Loading...</Text>
        </Flex>
      ) : (
        <Stack gap={3} onDragOver={handleDragOver} onDrop={handleDropOnList}>
          {ingredients.map((ingredient) => (
            <Box
              key={ingredient.id}
              borderWidth="1px"
              borderRadius="md"
              p={3}
              as="article"
              draggable
              onDragStart={(event) => handleDragStart(event, ingredient.id)}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDropOnCard(event, ingredient.id)}
              cursor="grab"
              data-testid={`ingredient-card-${ingredient.id}`}
            >
              <Flex align="center" gap={3} wrap="wrap">
                <CheckboxInput
                  type="checkbox"
                  checked={ingredient.included}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onToggleInclude(ingredient.id, event.currentTarget.checked)
                  }
                  aria-label={`Include ${ingredient.name}`}
                  flexShrink={0}
                  width="16px"
                  height="16px"
                />
                <Box minW="180px" flexShrink={0} py={1}>
                  <Heading size="sm">{ingredient.name}</Heading>
                  <Text color="gray.600" fontSize="xs">
                    {ingredient.carbo100g}g carbs • {ingredient.protein100g}g protein • {ingredient.fat100g}g fat • indivisible: {ingredient.indivisible ?? 'n/a'}g
                  </Text>
                </Box>
                <Flex gap={3} wrap="wrap" flex="1"justify="end">
                  {(['min', 'max', 'mandatory'] as IngredientField[]).map((field) => (
                    <Box key={field} minW="110px">
                      <Label
                        htmlFor={`${ingredient.id}-${field}`}
                        display="block"
                        fontSize="xs"
                        fontWeight="semibold"
                        mb={1}
                        textTransform="capitalize"
                      >
                        {field}
                      </Label>
                      <Input
                        id={`${ingredient.id}-${field}`}
                        type="number"
                        value={ingredient[field] ?? ''}
                        onChange={(event) => onFieldChange(ingredient.id, field, event.currentTarget.value)}
                        onBlur={() => onFieldCommit(ingredient)}
                        bg="gray.50"
                        size="sm"
                      />
                    </Box>
                  ))}
                </Flex>
                <IconButton
                  aria-label={`Edit ${ingredient.name}`}
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(ingredient);
                  }}
                >
                  <PencilIcon />
                </IconButton>
              </Flex>
            </Box>
          ))}
          {ingredients.length === 0 && (
            <Text color="gray.500">No ingredients yet. Add your first ingredient to start.</Text>
          )}
        </Stack>
      )}
    </Box>
  );
}
