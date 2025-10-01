import { memo } from 'react';

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

const MealsPanelComponent = ({
  meals,
  loading,
  selectedMealId,
  onSelectMeal,
  onAddMeal,
  onEditMeal,
  onImportMeals,
  onExportMeals,
  containerProps
}: MealsPanelProps) => {
  return (
    <Box
      {...containerProps}
      bg="white"
      p={{ base: 3, md: 5 }}
      borderRadius="md"
      boxShadow="sm"
      w="full"
      maxH={{ base: 'none', lg: '500px' }}
      overflowY={{ base: 'visible', lg: 'auto' }}
    >
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Heading size="sm">Meals</Heading>
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
        <Flex justify="center" py={8}>
          <Text color="gray.500" fontSize="sm">
            Loading...
          </Text>
        </Flex>
      ) : (
        <Stack gap={2}>
          {meals.map((meal) => (
            <Box
              key={meal.id}
              borderWidth="1px"
              borderRadius="md"
              p={{ base: 3, md: 4 }}
              bg={meal.id === selectedMealId ? 'teal.50' : 'white'}
              cursor="pointer"
              onClick={() => onSelectMeal(meal.id)}
            >
              <Flex
                justify="space-between"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={2}
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
            <Text color="gray.500" fontSize="sm">
              No meals yet. Create a meal to define your targets.
            </Text>
          )}
        </Stack>
      )}
    </Box>
  );
};

MealsPanelComponent.displayName = 'MealsPanel';

export const MealsPanel = memo(MealsPanelComponent);
