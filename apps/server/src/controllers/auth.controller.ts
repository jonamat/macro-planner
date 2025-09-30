import { Request, Response } from 'express';
import { ZodError } from 'zod';

import { loginSchema, signupSchema } from '../dtos/auth.dto';
import authService from '../services/auth.service';
import { isHttpError } from '../utils/http-error';

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await authService.login(payload);
      return res.json(result);
    } catch (error) {
      return this.handleError(res, error, 'AuthController.login');
    }
  }

  async signup(req: Request, res: Response) {
    try {
      const payload = signupSchema.parse(req.body);
      const result = await authService.signup(payload);
      return res.status(201).json(result);
    } catch (error) {
      return this.handleError(res, error, 'AuthController.signup');
    }
  }

  private handleError(res: Response, error: unknown, context: string) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Invalid request body',
        issues: error.issues
      });
    }

    if (isHttpError(error)) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error(context, error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
}

export default new AuthController();
