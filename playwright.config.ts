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
		// `npm run build` also runs prepack (every package check). The parallel e2e CI job sets
		// E2E_BUILD_COMMAND to build only the docs app, since the package job runs those checks.
		command: `${process.env.E2E_BUILD_COMMAND ?? 'npm run build'} && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: origin,
		timeout: 600_000,
		reuseExistingServer: !process.env.CI
	},

	// `webServer.url` (unlike `port`) does not infer a baseURL, and four suites navigate relative.
	use: { baseURL: origin },

	testDir: 'e2e',

	// CI only: two retries, and tests that passed on one (outcome `flaky`) go to the job summary as
	// warnings. Locally a flake fails, where it can be debugged.
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI
		? [['list'], ['github'], ['./tooling/flaky-tests/playwright-reporter.mjs']]
		: 'list'
});
