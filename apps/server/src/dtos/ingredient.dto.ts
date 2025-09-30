import { z } from 'zod';

const optionalFloat = z
  .preprocess((value) => {
    if (value === '' || value === undefined) return undefined;
    if (value === null) return null;
    return value;
  }, z.union([z.coerce.number().min(0), z.null()]))
  .optional();

const optionalSequence = z
  .preprocess((value) => {
    if (value === '' || value === undefined) return undefined;
    return value;
  }, z.coerce.number().int().min(0))
  .optional();

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  carbo100g: z.coerce.number().min(0),
  protein100g: z.coerce.number().min(0),
  fat100g: z.coerce.number().min(0),
  min: optionalFloat,
  max: optionalFloat,
  mandatory: optionalFloat,
  indivisible: optionalFloat,
  sequence: optionalSequence
});

export const updateIngredientSchema = createIngredientSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'No fields provided to update'
);

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
