import { defineConfig } from '@playwright/test';

// `E2E_PORT` lets several checkouts run the suite side by side without reusing each other's
// preview server.
const port = Number(process.env.E2E_PORT ?? 4173);
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
	// The preview binds 127.0.0.1 explicitly and Playwright waits on that exact URL: with the
	// default `localhost` host, a Linux runner binds only ::1, the port probe accepts it, and every
	// test then dials 127.0.0.1 and gets ERR_CONNECTION_REFUSED.
	webServer: {
		command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: origin,
		timeout: 600_000,
		reuseExistingServer: !process.env.CI
	},

	// `webServer.url` (unlike `port`) does not infer a baseURL, and four suites navigate relative.
	use: { baseURL: origin },

	testDir: 'e2e'
});
