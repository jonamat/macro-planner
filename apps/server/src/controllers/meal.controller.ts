import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { createMealSchema, updateMealSchema } from '../dtos/meal.dto';
import mealService from '../services/meal.service';
import { isHttpError } from '../utils/http-error';

class MealController {
  async list(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const meals = await mealService.list(userId);
    return res.json({ data: meals });
  }

  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const payload = createMealSchema.parse(req.body);
      const meal = await mealService.create(userId, payload);
      return res.status(201).json({ data: meal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request body', issues: error.issues });
      }

      if (isHttpError(error)) {
        return res.status(error.status).json({ message: error.message });
      }

      console.error('MealController.create', error);
      return res.status(500).json({ message: 'Unexpected server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Meal id is required' });
      }

      const payload = updateMealSchema.parse(req.body);
      const meal = await mealService.update(userId, id, payload);
      return res.json({ data: meal });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request body', issues: error.issues });
      }

      if (isHttpError(error)) {
        return res.status(error.status).json({ message: error.message });
      }

      console.error('MealController.update', error);
      return res.status(500).json({ message: 'Unexpected server error' });
    }
  }
}

export default new MealController();
