import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		timeout: 600_000,
		reuseExistingServer: !process.env.CI
	},

	testDir: 'e2e'
});
