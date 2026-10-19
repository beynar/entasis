import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// The Svelte options shared by the SvelteKit plugin (vite.config.ts) and ESLint's Svelte parser.
// SvelteKit 3 reads its configuration from the `sveltekit(...)` Vite plugin only: a
// `svelte.config.js` is an error there, so these live in a module of their own.
export const svelteOptions = {
	preprocess: [vitePreprocess()],
	compilerOptions: {
		experimental: {
			async: true
		}
	},
	extensions: ['.svelte', '.svx']
};
