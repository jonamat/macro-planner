import { z } from 'zod';

const base = {
  name: z.string().min(1, 'Name is required'),
  carbo: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  fat: z.coerce.number().min(0)
};

export const createMealSchema = z.object(base);
export const updateMealSchema = z.object(base).partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'No fields provided to update'
);

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
