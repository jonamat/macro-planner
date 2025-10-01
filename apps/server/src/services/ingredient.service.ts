import prisma from '../config/prisma';
import { CreateIngredientInput, UpdateIngredientInput } from '../dtos/ingredient.dto';
import { HttpError } from '../utils/http-error';

export class IngredientService {
  async list(userId: string) {
    const ingredients = await prisma.ingredient.findMany({
      where: { userId },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }]
    });
    return ingredients.map(this.toApi);
  }

  async create(userId: string, input: CreateIngredientInput) {
    this.validateRanges(input);

    const sequence = await this.resolveSequence(userId, input.sequence);

    const ingredient = await prisma.ingredient.create({
      data: {
        name: input.name.trim(),
        carbo100g: input.carbo100g,
        protein100g: input.protein100g,
        fat100g: input.fat100g,
        min: input.min ?? null,
        max: input.max ?? null,
        mandatory: input.mandatory ?? null,
        indivisible: input.indivisible ?? null,
        sequence,
        userId
      }
    });
    return this.toApi(ingredient);
  }

  async update(userId: string, ingredientId: string, input: UpdateIngredientInput) {
    this.validateRanges(input);

    const existing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, userId }
    });

    if (!existing) {
      throw new HttpError(404, 'Ingredient not found');
    }

    const sequence =
      input.sequence !== undefined
        ? input.sequence
        : existing.sequence;

    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        name: input.name?.trim() ?? existing.name,
        carbo100g: input.carbo100g ?? existing.carbo100g,
        protein100g: input.protein100g ?? existing.protein100g,
        fat100g: input.fat100g ?? existing.fat100g,
        min: input.min !== undefined ? input.min : existing.min,
        max: input.max !== undefined ? input.max : existing.max,
        mandatory: input.mandatory !== undefined ? input.mandatory : existing.mandatory,
        indivisible: input.indivisible !== undefined ? input.indivisible : existing.indivisible,
        sequence
      }
    });

    return this.toApi(ingredient);
  }

  async delete(userId: string, ingredientId: string) {
    const existing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, userId }
    });

    if (!existing) {
      throw new HttpError(404, 'Ingredient not found');
    }

    await prisma.ingredient.delete({ where: { id: ingredientId } });
  }

  private validateRanges(input: Pick<Partial<CreateIngredientInput>, 'min' | 'max' | 'mandatory'>) {
    const hasMin = typeof input.min === 'number';
    const hasMax = typeof input.max === 'number';

    if (hasMin && hasMax && (input.max ?? 0) < (input.min ?? 0)) {
      throw new HttpError(400, 'Max must be greater than or equal to min');
    }

    const hasMandatory = typeof input.mandatory === 'number';
    if (hasMandatory) {
      if (hasMin && (input.mandatory ?? 0) < (input.min ?? 0)) {
        throw new HttpError(400, 'Mandatory amount cannot be less than min');
      }
      if (hasMax && (input.mandatory ?? 0) > (input.max ?? 0)) {
        throw new HttpError(400, 'Mandatory amount cannot exceed max');
      }
    }
  }

  private async resolveSequence(userId: string, provided?: number) {
    if (provided !== undefined) {
      return provided;
    }

    const maxSequence = await prisma.ingredient.aggregate({
      where: { userId },
      _max: { sequence: true }
    });

    return (maxSequence._max.sequence ?? -1) + 1;
  }

  private toApi(record: {
    id: string;
    name: string;
    carbo100g: number;
    protein100g: number;
    fat100g: number;
    min: number | null;
    max: number | null;
    mandatory: number | null;
    indivisible: number | null;
    sequence: number;
  }) {
    return {
      id: record.id,
      name: record.name,
      carbo100g: record.carbo100g,
      protein100g: record.protein100g,
      fat100g: record.fat100g,
      min: record.min,
      max: record.max,
      mandatory: record.mandatory,
      indivisible: record.indivisible,
      sequence: record.sequence
    };
  }
}

export default new IngredientService();
