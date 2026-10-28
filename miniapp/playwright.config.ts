import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:6191/mini-program-showcase/', viewport: { width: 390, height: 844 } },
  webServer: {
    command: 'npm run preview -- --base /mini-program-showcase/',
    url: 'http://127.0.0.1:6191/mini-program-showcase/',
    reuseExistingServer: false,
  },
})
