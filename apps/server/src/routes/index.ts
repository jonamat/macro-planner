import { Router } from 'express';

import { authenticate } from '../middleware/authenticate';
import authRoutes from './auth.routes';
import ingredientRoutes from './ingredient.routes';
import mealRoutes from './meal.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/ingredients', authenticate, ingredientRoutes);
router.use('/meals', authenticate, mealRoutes);

export default router;
