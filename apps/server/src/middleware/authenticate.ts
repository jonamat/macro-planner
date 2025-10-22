import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import env from '../config/env';
import prisma from '../config/prisma';

interface AuthPayload {
  userId: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization header format' });
  }

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { lastActiveAt: new Date() },
      select: { id: true }
    });
    req.user = { id: user.id };
    return next();
  } catch {
    return res.status(401).json({ message: 'User session is no longer valid' });
  }
}
