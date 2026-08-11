import { defineConfig, devices } from '@playwright/test';

const appPath = process.env.GITHUB_ACTIONS ? '/aesthetic-bible-flow-generator/' : '/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:4173${appPath}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build:client && npm exec vite preview -- --host 127.0.0.1 --port 4173',
    url: `http://127.0.0.1:4173${appPath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
