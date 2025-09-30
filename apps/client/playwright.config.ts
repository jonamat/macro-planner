import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'yarn workspace @macro-calculator/client dev --host --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
