import app from './app';
import env from './config/env';
import prisma from './config/prisma';

const port = env.port;

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
