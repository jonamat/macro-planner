import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

import routes from './routes';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

export default app;
