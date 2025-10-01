import { Box, Button, CloseButton, Flex, Heading, IconButton, Input, Stack, Text, chakra } from '@chakra-ui/react';
import type { BoxProps, IconProps } from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

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

  const includedIngredients = useMemo(
    () => ingredients.filter((ingredient) => ingredient.included),
    [ingredients]
  );

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

  const handleSelectSuggestion = (ingredientId: string) => {
    onToggleInclude(ingredientId, true);
    setSearch('');
    setHighlightedIndex(0);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
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

    if (event.key === 'ArrowUp') {
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

    if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault();
      const selected =
        highlightedIndex >= 0 && highlightedIndex < suggestions.length
          ? suggestions[highlightedIndex]
          : suggestions[0];
      if (selected) {
        handleSelectSuggestion(selected.id);
      }
      return;
    }
    if (event.key === 'Escape') {
      setSearch('');
      setHighlightedIndex(0);
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
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setHighlightedIndex(0);
          }}
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
              suggestions.map((ingredient, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <Box
                    as="button"
                    key={ingredient.id}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    w="100%"
                    textAlign="left"
                    px={3}
                    py={2}
                    bg={isHighlighted ? 'gray.100' : 'white'}
                    _hover={{ bg: 'gray.100' }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectSuggestion(ingredient.id);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <Text fontWeight="semibold">{ingredient.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {ingredient.carbo100g}g carbs • {ingredient.protein100g}g protein • {ingredient.fat100g}g fat
                    </Text>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </Box>
      {includedIngredients.length > 0 && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={3}
          mb={4}
          bg="gray.50"
        >
          <Heading size="sm" mb={2} color="gray.700">
            Selected ingredients
          </Heading>
          <Stack gap={2}>
            {includedIngredients.map((ingredient) => {
              const macrosLabel = `${ingredient.carbo100g}g carbs • ${ingredient.protein100g}g protein • ${ingredient.fat100g}g fat`;
              const constraintLabel = `Min: ${ingredient.min ?? '—'}g • Max: ${ingredient.max ?? '—'}g • Mandatory: ${ingredient.mandatory ?? '—'}g`;
              return (
                <Flex
                  key={`selected-${ingredient.id}`}
                  align="center"
                  gap={4}
                  p={2}
                  borderRadius="md"
                  bg="white"
                  borderWidth="1px"
                >
                  <Text fontWeight="semibold" noOfLines={1} minW="150px">
                    {ingredient.name}
                  </Text>
                  <Text color="gray.600" fontSize="sm" noOfLines={1} flex="1" minW={0}>
                    {macrosLabel}
                  </Text>
                  <Text color="gray.500" fontSize="xs" noOfLines={1}>
                    {constraintLabel}
                  </Text>
                  <CloseButton
                    size="sm"
                    onClick={() => onToggleInclude(ingredient.id, false)}
                    aria-label={`Remove ${ingredient.name}`}
                  />
                </Flex>
              );
            })}
          </Stack>
        </Box>
      )}
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
                <Flex gap={3} wrap="wrap" flex="1" justify="end">
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
