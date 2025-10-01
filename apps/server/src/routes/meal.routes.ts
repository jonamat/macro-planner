import { Router } from 'express';

import mealController from '../controllers/meal.controller';

const router = Router();

router.get('/', (req, res) => mealController.list(req, res));
router.post('/', (req, res) => mealController.create(req, res));
router.patch('/:id', (req, res) => mealController.update(req, res));
router.delete('/:id', (req, res) => mealController.remove(req, res));

export default router;
