import { defineConfig } from '@playwright/test';

export default defineConfig({
	// The preview binds 127.0.0.1 explicitly and Playwright waits on that exact URL: with the
	// default `localhost` host, a Linux runner binds only ::1, the port probe accepts it, and every
	// test then dials 127.0.0.1 and gets ERR_CONNECTION_REFUSED.
	webServer: {
		command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173',
		timeout: 600_000,
		reuseExistingServer: !process.env.CI
	},

	testDir: 'e2e'
});
