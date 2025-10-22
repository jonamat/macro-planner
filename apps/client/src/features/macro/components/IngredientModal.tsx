import { Box, Input, Stack, chakra } from '@chakra-ui/react';
import { ChangeEvent, useEffect, useState } from 'react';

import type { IngredientModalValues } from '../types';
import { SimpleModal } from './SimpleModal';

const Label = chakra('label');

const emptyForm: IngredientModalValues = {
  name: '',
  carbo100g: '',
  protein100g: '',
  fat100g: '',
  min: '',
  max: '',
  mandatory: '',
  indivisible: ''
};

interface IngredientModalProps {
  open: boolean;
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: IngredientModalValues) => void;
  initialValues?: IngredientModalValues | undefined;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function IngredientModal({
  open,
  title,
  isSubmitting,
  onClose,
  onSubmit,
  initialValues,
  onDelete,
  isDeleting
}: IngredientModalProps) {
  const [form, setForm] = useState<IngredientModalValues>(initialValues ?? emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initialValues ?? emptyForm);
    }
  }, [initialValues, open]);

  const handleChange = (field: keyof IngredientModalValues) => (event: ChangeEvent<HTMLInputElement>) => {
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
          <Label htmlFor="ingredient-name" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
            Name
          </Label>
          <Input
            id="ingredient-name"
            value={form.name}
            onChange={handleChange('name')}
            bg="app.surfaceMuted"
            borderColor="whiteAlpha.200"
            _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
          />
        </Box>

        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Label htmlFor="ingredient-carbo" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Carbs (per 100g)
            </Label>
            <Input
              id="ingredient-carbo"
              type="number"
              value={form.carbo100g}
              onChange={handleChange('carbo100g')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="ingredient-protein" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Protein (per 100g)
            </Label>
            <Input
              id="ingredient-protein"
              type="number"
              value={form.protein100g}
              onChange={handleChange('protein100g')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="ingredient-fat" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Fat (per 100g)
            </Label>
            <Input
              id="ingredient-fat"
              type="number"
              value={form.fat100g}
              onChange={handleChange('fat100g')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Label htmlFor="ingredient-min" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Min (g)
            </Label>
            <Input
              id="ingredient-min"
              type="number"
              value={form.min}
              onChange={handleChange('min')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="ingredient-max" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Max (g)
            </Label>
            <Input
              id="ingredient-max"
              type="number"
              value={form.max}
              onChange={handleChange('max')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Label htmlFor="ingredient-mandatory" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Mandatory (g)
            </Label>
            <Input
              id="ingredient-mandatory"
              type="number"
              value={form.mandatory}
              onChange={handleChange('mandatory')}
              bg="app.surfaceMuted"
              borderColor="whiteAlpha.200"
              _focusVisible={{ borderColor: 'app.accent', boxShadow: '0 0 0 1px rgba(94, 234, 212, 0.35)' }}
            />
          </Box>
          <Box flex="1">
            <Label htmlFor="ingredient-indivisible" display="block" fontWeight="semibold" mb={1} color="app.textMuted">
              Indivisible (g)
            </Label>
            <Input
              id="ingredient-indivisible"
              type="number"
              value={form.indivisible}
              onChange={handleChange('indivisible')}
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
