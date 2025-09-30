import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import env from '../config/env';
import prisma from '../config/prisma';
import { LoginInput, SignupInput } from '../dtos/auth.dto';
import { HttpError } from '../utils/http-error';

interface AuthUser {
  id: string;
  username: string;
}

export class AuthService {
  async login(input: LoginInput) {
    const username = input.username.trim().toLowerCase();
    const password = input.password;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new HttpError(401, 'Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async signup(input: SignupInput) {
    const username = input.username.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new HttpError(409, 'Username already exists');
    }

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash
      }
    });

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthUser) {
    const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  }
}

export default new AuthService();
