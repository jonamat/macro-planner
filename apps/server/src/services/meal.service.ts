import prisma from '../config/prisma';
import { CreateMealInput, UpdateMealInput } from '../dtos/meal.dto';
import { HttpError } from '../utils/http-error';

export class MealService {
  async list(userId: string) {
    const meals = await prisma.meal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    return meals.map(this.toApi);
  }

  async create(userId: string, input: CreateMealInput) {
    const meal = await prisma.meal.create({
      data: {
        name: input.name.trim(),
        targetCarbo: input.carbo,
        targetProtein: input.protein,
        targetFat: input.fat,
        userId
      }
    });

    return this.toApi(meal);
  }

  async update(userId: string, mealId: string, input: UpdateMealInput) {
    const existing = await prisma.meal.findFirst({ where: { id: mealId, userId } });

    if (!existing) {
      throw new HttpError(404, 'Meal not found');
    }

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        name: input.name?.trim() ?? existing.name,
        targetCarbo: input.carbo ?? existing.targetCarbo,
        targetProtein: input.protein ?? existing.targetProtein,
        targetFat: input.fat ?? existing.targetFat
      }
    });

    return this.toApi(meal);
  }

  private toApi(record: {
    id: string;
    name: string;
    targetCarbo: number;
    targetProtein: number;
    targetFat: number;
  }) {
    return {
      id: record.id,
      name: record.name,
      carbo: record.targetCarbo,
      protein: record.targetProtein,
      fat: record.targetFat
    };
  }
}

export default new MealService();
