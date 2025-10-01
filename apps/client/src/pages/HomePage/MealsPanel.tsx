import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';

import type { ApiMeal } from '../../types/api';

interface MealsPanelProps {
  meals: ApiMeal[];
  loading: boolean;
  selectedMealId: string | null;
  onSelectMeal: (mealId: string) => void;
  onAddMeal: () => void;
  onEditMeal: (meal: ApiMeal) => void;
  onImportMeals: () => void;
  onExportMeals: () => void;
  containerProps?: BoxProps;
}

export function MealsPanel({
  meals,
  loading,
  selectedMealId,
  onSelectMeal,
  onAddMeal,
  onEditMeal,
  onImportMeals,
  onExportMeals,
  containerProps
}: MealsPanelProps) {
  return (
    <Box
      {...containerProps}
      bg="white"
      p={5}
      borderRadius="md"
      boxShadow="sm"
      w="full"
      maxH="500px"
      overflowY="auto"
    >
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
        <Heading size="md">Meals</Heading>
        <Flex gap={2} wrap="wrap">
          <Button size="sm" variant="outline" onClick={onExportMeals}>
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={onImportMeals}>
            Import JSON
          </Button>
          <Button size="sm" colorScheme="teal" onClick={onAddMeal}>
            Add Meal
          </Button>
        </Flex>
      </Flex>
      {loading ? (
        <Flex justify="center" py={10}>
          <Text color="gray.500">Loading...</Text>
        </Flex>
      ) : (
        <Stack gap={3}>
          {meals.map((meal) => (
            <Box
              key={meal.id}
              borderWidth="1px"
              borderRadius="md"
              p={4}
              bg={meal.id === selectedMealId ? 'teal.50' : 'white'}
              cursor="pointer"
              onClick={() => onSelectMeal(meal.id)}
            >
              <Flex
                justify="space-between"
                align={{ base: 'flex-start', sm: 'center' }}
                direction={{ base: 'column', sm: 'row' }}
                gap={3}
              >
                <Box>
                  <Heading size="sm">{meal.name}</Heading>
                  <Text color="gray.600" fontSize="sm">
                    {meal.carbo}g carbs • {meal.protein}g protein • {meal.fat}g fat
                  </Text>
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditMeal(meal);
                  }}
                >
                  Edit
                </Button>
              </Flex>
            </Box>
          ))}

          {meals.length === 0 && (
            <Text color="gray.500">No meals yet. Create a meal to define your targets.</Text>
          )}
        </Stack>
      )}
    </Box>
  );
}
