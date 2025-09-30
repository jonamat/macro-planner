import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import env from '../config/env';

interface AuthPayload {
  userId: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = { id: payload.userId };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
