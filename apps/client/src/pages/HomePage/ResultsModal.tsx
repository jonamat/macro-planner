import { Box, Button, Flex, Heading, Text, chakra } from '@chakra-ui/react';

import type { CalculationState } from './types';

const ModalSurface = chakra('div');
const TableEl = chakra('table');
const TheadEl = chakra('thead');
const TbodyEl = chakra('tbody');
const TrEl = chakra('tr');
const ThEl = chakra('th');
const TdEl = chakra('td');

interface ResultsModalProps {
  open: boolean;
  calculation: CalculationState | null;
  onClose: () => void;
}

export function ResultsModal({ open, calculation, onClose }: ResultsModalProps) {
  if (!open || !calculation) {
    return null;
  }

  return (
    <ModalSurface
      position="fixed"
      inset="0"
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="modal"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="2xl"
        w="100%"
        maxW="5xl"
        p={6}
        onClick={(event) => event.stopPropagation()}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading size="md">Optimization results</Heading>
            <Text color="gray.600" fontSize="sm">
              Target meal: {calculation.targetName}
            </Text>
          </Box>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </Flex>

        <Box overflowX="auto">
          <TableEl width="100%" borderWidth="1px" borderRadius="md" overflow="hidden">
            <TheadEl bg="gray.100">
              <TrEl>
                <ThEl textAlign="left" px={4} py={2}>Ingredient</ThEl>
                <ThEl textAlign="right" px={4} py={2}>Weight (g)</ThEl>
                <ThEl textAlign="right" px={4} py={2}>Carbs (g)</ThEl>
                <ThEl textAlign="right" px={4} py={2}>Protein (g)</ThEl>
                <ThEl textAlign="right" px={4} py={2}>Fat (g)</ThEl>
                <ThEl textAlign="right" px={4} py={2}>kCal</ThEl>
              </TrEl>
            </TheadEl>
            <TbodyEl>
              {calculation.rows.map((row) => (
                <TrEl key={row.name} _odd={{ bg: 'gray.50' }}>
                  <TdEl px={4} py={2}>{row.name}</TdEl>
                  <TdEl px={4} py={2} textAlign="right">{row.weight.toFixed(2)}</TdEl>
                  <TdEl px={4} py={2} textAlign="right">{row.carbo.toFixed(2)}</TdEl>
                  <TdEl px={4} py={2} textAlign="right">{row.protein.toFixed(2)}</TdEl>
                  <TdEl px={4} py={2} textAlign="right">{row.fat.toFixed(2)}</TdEl>
                  <TdEl px={4} py={2} textAlign="right">{row.kcal.toFixed(2)}</TdEl>
                </TrEl>
              ))}
              <TrEl fontWeight="semibold">
                <TdEl px={4} py={2}>Totals</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.totalWeight.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.totalCarbo.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.totalProtein.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.totalFat.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.totalKcal.toFixed(2)}</TdEl>
              </TrEl>
              <TrEl>
                <TdEl px={4} py={2}>Targets</TdEl>
                <TdEl px={4} py={2} textAlign="right">-</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.targetCarbo.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.targetProtein.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.targetFat.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.targetKcal.toFixed(2)}</TdEl>
              </TrEl>
              <TrEl>
                <TdEl px={4} py={2}>Deviation (%)</TdEl>
                <TdEl px={4} py={2} textAlign="right">-</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.deviationCarbo.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.deviationProtein.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.deviationFat.toFixed(2)}</TdEl>
                <TdEl px={4} py={2} textAlign="right">{calculation.deviationKcal.toFixed(2)}</TdEl>
              </TrEl>
            </TbodyEl>
          </TableEl>
        </Box>
      </Box>
    </ModalSurface>
  );
}
