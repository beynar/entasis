import font from '@svelte-plugin/font';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { svelaiPropsDocs } from './tooling/props-docs/plugin.js';
import { svelaiStructureDocs } from './tooling/structure-docs/plugin.js';

export default defineConfig({
	optimizeDeps: {
		include: [
			'@modelcontextprotocol/ext-apps',
			'@modelcontextprotocol/ext-apps/app-bridge',
			'@modelcontextprotocol/ext-apps/server'
		]
	},
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
		svelaiPropsDocs(),
		svelaiStructureDocs()
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
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
