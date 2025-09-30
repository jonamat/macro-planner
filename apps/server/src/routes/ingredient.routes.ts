import { Router } from 'express';

import ingredientController from '../controllers/ingredient.controller';

const router = Router();

router.get('/', (req, res) => ingredientController.list(req, res));
router.post('/', (req, res) => ingredientController.create(req, res));
router.patch('/:id', (req, res) => ingredientController.update(req, res));

export default router;
