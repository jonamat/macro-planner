import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { createIngredientSchema, updateIngredientSchema } from '../dtos/ingredient.dto';
import ingredientService from '../services/ingredient.service';
import { isHttpError } from '../utils/http-error';

class IngredientController {
  async list(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const ingredients = await ingredientService.list(userId);
    return res.json({ data: ingredients });
  }

  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const payload = createIngredientSchema.parse(req.body);
      const ingredient = await ingredientService.create(userId, payload);
      return res.status(201).json({ data: ingredient });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request body', issues: error.issues });
      }

      if (isHttpError(error)) {
        return res.status(error.status).json({ message: error.message });
      }

      console.error('IngredientController.create', error);
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
        return res.status(400).json({ message: 'Ingredient id is required' });
      }

      const payload = updateIngredientSchema.parse(req.body);
      const ingredient = await ingredientService.update(userId, id, payload);
      return res.json({ data: ingredient });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request body', issues: error.issues });
      }

      if (isHttpError(error)) {
        return res.status(error.status).json({ message: error.message });
      }

      console.error('IngredientController.update', error);
      return res.status(500).json({ message: 'Unexpected server error' });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Ingredient id is required' });
      }

      await ingredientService.delete(userId, id);
      return res.status(204).send();
    } catch (error) {
      if (isHttpError(error)) {
        return res.status(error.status).json({ message: error.message });
      }

      console.error('IngredientController.remove', error);
      return res.status(500).json({ message: 'Unexpected server error' });
    }
  }
}

export default new IngredientController();
