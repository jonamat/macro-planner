import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_DB_URL = 'file:./prisma/prisma/data/dev.db';
let schemaEnsured = false;

function toAbsolutePath(databaseUrl: string) {
  const rawPath = databaseUrl.replace(/^file:/, '');
  if (!rawPath) {
    return path.resolve(PROJECT_ROOT, 'prisma/data/dev.db');
  }

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  return path.resolve(PROJECT_ROOT, rawPath);
}

function ensureDatabaseDirectory(databaseUrl: string | undefined) {
  if (!databaseUrl?.startsWith('file:')) {
    return;
  }

  const absolutePath = toAbsolutePath(databaseUrl);
  const directory = path.dirname(absolutePath);
  fs.mkdirSync(directory, { recursive: true });
}

function ensureDatabaseFile(databaseUrl: string | undefined) {
  if (!databaseUrl?.startsWith('file:')) {
    return;
  }

  const absolutePath = toAbsolutePath(databaseUrl);
  if (!fs.existsSync(absolutePath)) {
    const handle = fs.openSync(absolutePath, 'a');
    fs.closeSync(handle);
  }
}

function resolvePrismaBinary() {
  const binaryName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
  return path.resolve(PROJECT_ROOT, 'node_modules', '.bin', binaryName);
}

export function ensureDatabaseSchema() {
  if (schemaEnsured || process.env.SKIP_PRISMA_MIGRATE === 'true') {
    schemaEnsured = true;
    return;
  }

  const prismaBinary = resolvePrismaBinary();
  if (!fs.existsSync(prismaBinary)) {
    schemaEnsured = true;
    return;
  }

  const schemaPath = path.resolve(PROJECT_ROOT, 'prisma/schema.prisma');

  try {
    execFileSync(
      prismaBinary,
      ['migrate', 'deploy', '--schema', schemaPath],
      {
        cwd: PROJECT_ROOT,
        stdio: process.env.NODE_ENV === 'test' ? 'pipe' : 'inherit'
      }
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[prisma] Failed to run migrations automatically', err);
    }
  } finally {
    schemaEnsured = true;
  }
}

export function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(PROJECT_ROOT, '.env') });
  }

  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(PROJECT_ROOT, 'prisma/.env') });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DEFAULT_DB_URL;
  }

  ensureDatabaseDirectory(process.env.DATABASE_URL);
  ensureDatabaseFile(process.env.DATABASE_URL);

  if (process.env.DATABASE_URL?.startsWith('file:')) {
    const absolutePath = toAbsolutePath(process.env.DATABASE_URL);
    process.env.DATABASE_URL = `file:${absolutePath}`;
  }
}

ensureDatabaseUrl();
ensureDatabaseSchema();

export const prisma = new PrismaClient();

export default prisma;
