import fs from 'node:fs';
import path from 'node:path';

describe('ensureDatabaseUrl', () => {
  const projectRoot = path.resolve(__dirname, '../../../../..');
  const defaultDbUrl = 'file:./prisma/prisma/data/dev.db';
  const defaultDbDir = path.resolve(projectRoot, 'prisma/prisma/data');
  const defaultDbPath = path.resolve(projectRoot, 'prisma/prisma/data/dev.db');

  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    jest.clearAllMocks();
  });

  it('loads the default database url and ensures the directory exists', () => {
    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({})),
      }));
      require('../prisma');
    });

    expect(process.env.DATABASE_URL).toBe(`file:${defaultDbPath}`);
    expect(fs.existsSync(defaultDbDir)).toBe(true);
    expect(fs.existsSync(defaultDbPath)).toBe(true);
  });

  it('keeps an existing database url and creates its directory', () => {
    const relativePath = `./tmp/prisma-tests/test-${Date.now()}.db`;
    const absolutePath = path.resolve(projectRoot, relativePath);
    const targetDir = path.dirname(absolutePath);
    fs.rmSync(targetDir, { recursive: true, force: true });

    jest.isolateModules(() => {
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => ({})),
      }));
      process.env.DATABASE_URL = `file:${relativePath}`;
      const { ensureDatabaseUrl } = require('../prisma');
      ensureDatabaseUrl();
    });

    expect(process.env.DATABASE_URL).toBe(`file:${absolutePath}`);
    expect(fs.existsSync(targetDir)).toBe(true);
    expect(fs.existsSync(absolutePath)).toBe(true);

    fs.rmSync(targetDir, { recursive: true, force: true });
  });
});
