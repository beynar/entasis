// The view transitions of a theme change load on demand (`loadThemeTransition`). The swap stays
// immediate without a transition or where the browser cannot play one, and a change asked for
// while the code loads is not overwritten by the one before it.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Harness from './ThemeHostsHarness.test.svelte';
import { loadThemeTransition, type ThemeState } from './theme.state.svelte.js';

function mountTheme(props: Record<string, unknown> = {}) {
	let theme!: ThemeState;
	render(Harness, {
		props: {
			...props,
			report: (state: ThemeState) => {
				theme = state;
				return true as const;
			}
		}
	});
	flushSync();
	return theme;
}

type ViewTransitionDocument = { startViewTransition?: unknown };

// A browser that plays view transitions; the reveal animation itself is skipped (`ready` rejects).
function supportViewTransitions() {
	const start = vi.fn((update: () => void | Promise<void>) => {
		void update();
		return { ready: Promise.reject(new Error('skipped')), finished: Promise.resolve() };
	});
	(document as ViewTransitionDocument).startViewTransition = start;
	// jsdom reports a page that is not shown, where no transition plays.
	Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
	return start;
}

const settle = async () => {
	await loadThemeTransition();
	await tick();
	await tick();
};

afterEach(() => {
	// The theme is kept in storage; each test starts from the default one.
	localStorage.clear();
	delete (document as ViewTransitionDocument).startViewTransition;
	delete (document as { visibilityState?: string }).visibilityState;
	document.documentElement.removeAttribute('data-entasis-theme-transition');
});

describe('Theme transition loading', () => {
	test('without a transition the theme changes at once', () => {
		const theme = mountTheme();
		const start = supportViewTransitions();
		theme.theme = 'dark';
		expect(theme.theme).toBe('dark');
		expect(start).not.toHaveBeenCalled();
	});

	test('a browser that cannot play the transition changes the theme at once', () => {
		const theme = mountTheme({ transition: 'radial-top-right' });
		theme.theme = 'dark';
		expect(theme.theme).toBe('dark');
	});

	test('with a transition the change runs inside a view transition', async () => {
		const theme = mountTheme({ transition: 'radial-top-right' });
		const start = supportViewTransitions();
		theme.theme = 'dark';
		await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
		await settle();
		expect(theme.theme).toBe('dark');
	});

	test('a change asked for while the transition loads wins over the one before it', async () => {
		const theme = mountTheme({ transition: 'line-top' });
		const start = supportViewTransitions();
		const initial = theme.theme;
		theme.theme = initial === 'dark' ? 'light' : 'dark';
		// Not applied yet: the transition's code is on its way.
		expect(theme.theme).toBe(initial);
		theme.theme = initial;
		await settle();
		expect(start).not.toHaveBeenCalled();
		expect(theme.theme).toBe(initial);
	});
});
