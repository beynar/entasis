import font from '@svelte-plugin/font';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { entasisPropsDocs } from './tooling/props-docs/plugin.js';
import { entasisStructureDocs } from './tooling/structure-docs/plugin.js';

// Test file kinds. jsdom has no layout, so focus order, tabbability, positioning and real pointer
// or keyboard input are tested in `*.browser.test.ts` files, which run in Chromium and WebKit.
const browserTests = 'src/**/*.browser.{test,spec}.{js,ts}';
const componentTests = 'src/**/*.svelte.{test,spec}.{js,ts}';
// Benchmarks run only through `npm run bench` (Chromium); see src/benchmarks/fixture.ts.
const benchmarks = 'src/benchmarks/**/*.bench.ts';

// The docs dev server and build never use the browser provider, so only Vitest (modes test,
// benchmark and baseline) imports it; loading it costs about a second.
const browserProvider = async (mode: string) =>
	mode === 'development' || mode === 'production'
		? undefined
		: (await import('@vitest/browser-playwright')).playwright();

const browserMode = (
	provider: Awaited<ReturnType<typeof browserProvider>>,
	...browsers: ('chromium' | 'webkit')[]
) => ({
	enabled: true,
	provider,
	headless: true,
	// A fixed viewport keeps positioning assertions identical on every machine.
	viewport: { width: 1280, height: 800 },
	// Failure screenshots would land in __screenshots__ next to the test file.
	screenshotFailures: false,
	instances: browsers.map((browser) => ({ browser }))
});

export default defineConfig(async ({ mode }) => ({
	plugins: [
		font({
			autoDetect: false,
			fonts: [
				{
					family: 'Fira Mono',
					cssVariable: '--font-mono'
				},
				{
					family: 'Noto Sans',
					cssVariable: '--font-sans'
				},
				{
					family: 'Playfair Display',
					cssVariable: '--font-serif'
				}
			]
		}),
		tailwindcss(),
		sveltekit(),
		entasisPropsDocs(),
		entasisStructureDocs()
	],

	test: {
		projects: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],

				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: [componentTests],
					exclude: ['src/lib/server/**', browserTests],
					setupFiles: ['./vitest-setup-client.ts'],
					benchmark: { include: [] }
				}
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: [componentTests, browserTests],
					benchmark: { include: [] }
				}
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'browser',
					include: [browserTests],
					clearMocks: true,
					setupFiles: ['./vitest-setup-browser.ts'],
					benchmark: { include: [] },
					browser: browserMode(await browserProvider(mode), 'chromium', 'webkit')
				}
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'benchmarks',
					include: [],
					setupFiles: ['./vitest-setup-browser.ts'],
					benchmark: { include: [benchmarks] },
					// `npm run bench:baseline` (--mode baseline) rewrites the committed baselines.
					provide: { updateBenchmarkBaselines: mode === 'baseline' },
					browser: browserMode(await browserProvider(mode), 'chromium')
				}
			}
		]
	}
}));
