import { BROWSER as browser } from 'esm-env';
import { MediaQuery } from 'svelte/reactivity';
import type { ThemeState } from '$lib/components/Theme/theme.state.svelte.js';

/** The single source of the reduced-motion media query string for the library. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Attribute Theme toggles on `<html>` while motion should be reduced, so CSS-only
 * animations can key off it (`html[data-entasis-reduce-motion] ...`) and honour the
 * Theme `reduceMotion` override, not just the OS setting. Declared in `$lib/tailwind/scales`
 * so the Tailwind motion engine can zero the `--duration-*` scale under the same attribute.
 */
export { REDUCED_MOTION_ATTRIBUTE } from '$lib/tailwind/scales.js';

// The most recently mounted ThemeState. Lets `prefersReducedMotion()` resolve the
// Theme from event handlers and plain modules, where `getContext` is unavailable.
let activeTheme: ThemeState | null = null;

/**
 * Registers `theme` as the active Theme; the returned function restores the previous one. Browser
 * only: on the server a module-level Theme would outlive its request and be read by the next one.
 */
export function registerActiveTheme(theme: ThemeState) {
	if (!browser) return () => {};
	const previous = activeTheme;
	activeTheme = theme;
	return () => {
		if (activeTheme === theme) activeTheme = previous;
	};
}

let fallbackQuery: MediaQuery | null = null;

/**
 * Whether motion should be reduced. Reads the mounted Theme when there is one
 * (so the `reduceMotion` prop override applies), otherwise the OS media query.
 * Reactive when read inside `$derived` / `$effect`; also safe to call from event
 * handlers and transition functions. Always `false` on the server.
 */
export function prefersReducedMotion(): boolean {
	if (activeTheme) return activeTheme.preferReducesMotion;
	if (!browser) return false;
	fallbackQuery ??= new MediaQuery(REDUCED_MOTION_QUERY);
	return fallbackQuery.current;
}
