import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const tmpDir = path.join(repoRoot, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const tempDbFileName = `playwright-db-${process.pid}-${Date.now()}.sqlite`;
const tempDbRelativePosix = path.posix.join('tmp', tempDbFileName);
const tempDbFile = path.join(repoRoot, tempDbRelativePosix);
const tempDbUrl = `file:${tempDbFile}`;
const serverPort = 4100;

// Ensure Playwright tests hit the same API port as the dev server started below.
process.env.SERVER_PORT = String(serverPort);

const migrationSteps = [
  '20240814000000_init/migration.sql',
  '20250929100931_add_sequence_to_ingredients/migration.sql',
  '20251001090000_remove_sequence_from_ingredient/migration.sql'
];

const dbBootstrapCommand = [
  `DB_FILE="${tempDbFile}"`,
  'rm -f "$DB_FILE"',
  'sqlite3 "$DB_FILE" ".databases"',
  ...migrationSteps.map(
    (migration) => `sqlite3 "$DB_FILE" ".read prisma/migrations/${migration}"`
  ),
  `DATABASE_URL="${tempDbUrl}" JWT_SECRET="test-secret" SERVER_PORT=${serverPort} yarn dev`
].join(' && ');

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry'
  },
  webServer: {
    command: `bash -lc '${dbBootstrapCommand}'`,
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: tempDbUrl,
      JWT_SECRET: 'test-secret',
      SERVER_PORT: String(serverPort),
      PORT: '5173'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
