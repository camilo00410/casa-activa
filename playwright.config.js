import { defineConfig, devices } from '@playwright/test';

/** Pruebas de extremo a extremo sobre el mismo servidor estático que usa el proyecto. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 30000,
  use: { baseURL: 'http://localhost:4173', trace: 'off', locale: 'es-CO', timezoneId: 'America/Bogota' },
  webServer: { command: 'node scripts/servidor.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 800 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 800 } }, testMatch: /flujos/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 800 } }, testMatch: /flujos/ },
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } }, testMatch: /flujos|responsive/ },
  ],
});
