// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PUERTO = Number(process.env.PUERTO || 4173);
const URL_BASE = process.env.URL_BASE || `http://127.0.0.1:${PUERTO}`;
const EN_CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests/e2e',
  // Cada archivo corre en paralelo; dentro de un archivo, también, salvo `describe.serial`.
  fullyParallel: true,
  // En CI un `test.only` olvidado hace fallar la corrida en lugar de saltear el resto.
  forbidOnly: EN_CI,
  retries: EN_CI ? 2 : 0,
  workers: EN_CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: EN_CI
    ? [['blob'], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: URL_BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Bootstrap desactiva sus transiciones ante `prefers-reduced-motion`: sin animaciones no hay
    // carrera entre el click y el final del `transitionend` del modal.
    reducedMotion: 'reduce',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }
  ],
  // Cuando se apunta a un entorno ya desplegado (URL_BASE externa) no se levanta nada.
  webServer: process.env.URL_BASE
    ? undefined
    : {
        command: 'node scripts/servidor.mjs',
        url: `http://127.0.0.1:${PUERTO}`,
        reuseExistingServer: !EN_CI,
        timeout: 30_000,
        env: { PUERTO: String(PUERTO) }
      }
});
