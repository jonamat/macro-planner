import { Box, Button, Flex, Heading, Stack, Table, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import type { CalculationState } from '../types';

interface ResultsCardProps {
  calculation: CalculationState;
  onClose: () => void;
}

export function ResultsCard({ calculation, onClose }: ResultsCardProps) {
  const { t } = useTranslation();
  
  return (
    <Box
      bg="app.surface"
      borderRadius="card"
      boxShadow="card"
      border="1px solid rgba(94, 234, 212, 0.12)"
      p={{ base: 5, md: 6 }}
    >
      <Flex align={{ base: 'flex-start', sm: 'center' }} justify="space-between" mb={4} gap={3}>
        <Stack gap={1}>
          <Heading size="md" letterSpacing="wide">
            {t("Optimization Results")}
          </Heading>
          <Text color="app.textMuted" fontSize="sm">
            {t("Target meal")} · {calculation.targetName}
          </Text>
        </Stack>
        <Button variant="ghost" color="app.textMuted" _hover={{ bg: 'whiteAlpha.100' }} onClick={onClose}>
          {t("Clear")}
        </Button>
      </Flex>

      <Box
        border="1px solid rgba(94, 234, 212, 0.28)"
        borderRadius="lg"
        overflowX="auto"
        bg="linear-gradient(155deg, rgba(14, 17, 27, 0.96) 0%, rgba(24, 29, 42, 0.92) 100%)"
      >
        <Table.Root size="sm" minWidth="720px" borderRadius="lg" borderCollapse="separate" borderSpacing={0}>
          <Table.Header bg="rgba(12, 16, 25, 0.95)" backdropFilter="blur(10px)">
            <Table.Row bg="rgba(12, 16, 25, 0.95)">
              <Table.ColumnHeader
                color="rgba(240, 249, 255, 0.92)"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.08em"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("Ingredient")}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="end"
                color="rgba(160, 210, 255, 0.9)"
                fontSize="xs"
                textTransform="uppercase"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("Weight (g)")}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="end"
                color="rgba(148, 197, 255, 0.88)"
                fontSize="xs"
                textTransform="uppercase"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("Carbs (g)")}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="end"
                color="rgba(148, 197, 255, 0.88)"
                fontSize="xs"
                textTransform="uppercase"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("Protein (g)")}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="end"
                color="rgba(148, 197, 255, 0.88)"
                fontSize="xs"
                textTransform="uppercase"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("Fat (g)")}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                textAlign="end"
                color="rgba(148, 197, 255, 0.88)"
                fontSize="xs"
                textTransform="uppercase"
                borderBottom="1px solid rgba(94, 234, 212, 0.28)"
              >
                {t("kcal")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {calculation.rows.map((row, index) => (
              <Table.Row
                key={row.name}
                bg={index % 2 === 0 ? 'rgba(28, 34, 52, 0.88)' : 'rgba(22, 27, 42, 0.88)'}
                _hover={{ bg: 'rgba(94, 234, 212, 0.16)' }}
              >
                <Table.Cell fontWeight="medium" color="rgba(245, 247, 255, 0.92)">{row.name}</Table.Cell>
                <Table.Cell textAlign="end" color="rgba(236, 248, 255, 0.9)">{Math.round(row.weight)}</Table.Cell>
                <Table.Cell textAlign="end" color="rgba(236, 248, 255, 0.9)">{row.carbo.toFixed(2)}</Table.Cell>
                <Table.Cell textAlign="end" color="rgba(236, 248, 255, 0.9)">{row.protein.toFixed(2)}</Table.Cell>
                <Table.Cell textAlign="end" color="rgba(236, 248, 255, 0.9)">{row.fat.toFixed(2)}</Table.Cell>
                <Table.Cell textAlign="end" color="rgba(236, 248, 255, 0.9)">{Math.round(row.kcal)}</Table.Cell>
              </Table.Row>
            ))}
            <Table.Row fontWeight="semibold" borderTop="1px solid rgba(94, 234, 212, 0.4)" bg="rgba(94, 234, 212, 0.38)">
              <Table.Cell color="white">{t("Totals")}</Table.Cell>
              <Table.Cell textAlign="end" color="white">{Math.round(calculation.totalWeight)}</Table.Cell>
              <Table.Cell textAlign="end" color="white">{Math.round(calculation.totalCarbo)}</Table.Cell>
              <Table.Cell textAlign="end" color="white">{Math.round(calculation.totalProtein)}</Table.Cell>
              <Table.Cell textAlign="end" color="white">{Math.round(calculation.totalFat)}</Table.Cell>
              <Table.Cell textAlign="end" color="white">{Math.round(calculation.totalKcal)}</Table.Cell>
            </Table.Row>
            <Table.Row bg="rgba(26, 30, 44, 0.92)">
              <Table.Cell color="app.textMuted">{t("Targets")}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">-</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.targetCarbo)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.targetProtein)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.targetFat)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.targetKcal)}</Table.Cell>
            </Table.Row>
            <Table.Row bg="rgba(21, 24, 38, 0.88)">
              <Table.Cell color="app.textMuted">{t("Deviation (%)")}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">-</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.deviationCarbo)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.deviationProtein)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.deviationFat)}</Table.Cell>
              <Table.Cell textAlign="end" color="app.textMuted">{Math.round(calculation.deviationKcal)}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
