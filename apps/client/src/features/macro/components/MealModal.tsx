import { Box, Input, Stack, chakra } from '@chakra-ui/react';
import { ChangeEvent, useEffect, useState } from 'react';

import type { MealModalValues } from '../types';
import { SimpleModal } from './SimpleModal';

const Label = chakra('label');

const emptyForm: MealModalValues = {
  name: '',
  carbo: '',
  protein: '',
  fat: ''
};

interface MealModalProps {
  open: boolean;
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: MealModalValues) => void;
  initialValues?: MealModalValues | undefined;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function MealModal({
  open,
  title,
  isSubmitting,
  onClose,
  onSubmit,
  initialValues,
  onDelete,
  isDeleting
}: MealModalProps) {
  const [form, setForm] = useState<MealModalValues>(initialValues ?? emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initialValues ?? emptyForm);
    }
  }, [initialValues, open]);

  const handleChange = (field: keyof MealModalValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SimpleModal
      open={open}
      title={title}
      onClose={onClose}
      onSubmit={() => onSubmit(form)}
      isSubmitting={isSubmitting}
      {...(onDelete ? { onDelete, isDeleting } : {})}
    >
      <Stack gap={4}>
        <Box>
          <Label htmlFor="meal-name" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
            Meal name
          </Label>
          <Input
            id="meal-name"
            value={form.name}
            onChange={handleChange('name')}
            bg="app.surfaceMuted"
            borderColor="whiteAlpha.200"
            _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
          />
        </Box>
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Label htmlFor="meal-carbs" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Carbs (g)
            </Label>
            <Input
              id="meal-carbs"
              type="number"
              value={form.carbo}
              onChange={handleChange('carbo')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="meal-protein" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Protein (g)
            </Label>
            <Input
              id="meal-protein"
              type="number"
              value={form.protein}
              onChange={handleChange('protein')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="meal-fat" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Fat (g)
            </Label>
            <Input
              id="meal-fat"
              type="number"
              value={form.fat}
              onChange={handleChange('fat')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
        </Stack>
      </Stack>
    </SimpleModal>
  );
}
