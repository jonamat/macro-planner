import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import env from './config/env';
import routes from './routes';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const allowedOrigins = new Set(env.corsOrigins);
const hppMiddleware = hpp() as unknown as express.RequestHandler;
const compressionMiddleware = compression() as unknown as express.RequestHandler;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(hppMiddleware);
app.use(compressionMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}) as unknown as express.RequestHandler;

app.use('/api', apiLimiter);

app.use('/api', routes);
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});

const clientDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.path} not found` });
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

export default app;
