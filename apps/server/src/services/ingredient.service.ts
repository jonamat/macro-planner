import prisma from '../config/prisma';
import { CreateIngredientInput, UpdateIngredientInput } from '../dtos/ingredient.dto';
import { HttpError } from '../utils/http-error';

export class IngredientService {
  async list(userId: string) {
    const ingredients = await prisma.ingredient.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    return ingredients.map(this.toApi);
  }

  async create(userId: string, input: CreateIngredientInput) {
    const normalizedMin = input.min ?? null;
    const normalizedMax = this.normalizeMax(input.max);
    const normalizedMandatory = input.mandatory ?? null;

    this.validateRanges({ min: normalizedMin, max: normalizedMax, mandatory: normalizedMandatory });

    const ingredient = await prisma.ingredient.create({
      data: {
        name: input.name.trim(),
        carbo100g: input.carbo100g,
        protein100g: input.protein100g,
        fat100g: input.fat100g,
        min: normalizedMin,
        max: normalizedMax,
        mandatory: normalizedMandatory,
        indivisible: input.indivisible ?? null,
        userId
      }
    });
    return this.toApi(ingredient);
  }

  async update(userId: string, ingredientId: string, input: UpdateIngredientInput) {
    const existing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, userId }
    });

    if (!existing) {
      throw new HttpError(404, 'Ingredient not found');
    }

    const nextMin = input.min !== undefined ? input.min : existing.min;
    const maxProvided = input.max !== undefined;
    const nextMax = maxProvided ? this.normalizeMax(input.max) : existing.max;
    const nextMandatory =
      input.mandatory !== undefined ? input.mandatory : existing.mandatory;

    this.validateRanges({ min: nextMin, max: nextMax, mandatory: nextMandatory });

    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        name: input.name?.trim() ?? existing.name,
        carbo100g: input.carbo100g ?? existing.carbo100g,
        protein100g: input.protein100g ?? existing.protein100g,
        fat100g: input.fat100g ?? existing.fat100g,
        min: input.min !== undefined ? nextMin : existing.min,
        max: maxProvided ? nextMax : existing.max,
        mandatory: input.mandatory !== undefined ? nextMandatory : existing.mandatory,
        indivisible: input.indivisible !== undefined ? input.indivisible : existing.indivisible
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
  private validateRanges(input: { min: number | null | undefined; max: number | null | undefined; mandatory: number | null | undefined }) {
    const minValue = typeof input.min === 'number' ? input.min : undefined;
    const maxValue = typeof input.max === 'number' ? input.max : undefined;

    if (minValue !== undefined && maxValue !== undefined && maxValue < minValue) {
      throw new HttpError(400, 'Max must be greater than or equal to min');
    }

    const mandatoryValue = typeof input.mandatory === 'number' ? input.mandatory : undefined;
    if (mandatoryValue !== undefined) {
      if (minValue !== undefined && mandatoryValue < minValue) {
        throw new HttpError(400, 'Mandatory amount cannot be less than min');
      }
      if (maxValue !== undefined && mandatoryValue > maxValue) {
        throw new HttpError(400, 'Mandatory amount cannot exceed max');
      }
    }
  }

  private normalizeMax(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (value <= 0) {
      return null;
    }
    return value;
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
      indivisible: record.indivisible
    };
  }
}

export default new IngredientService();
