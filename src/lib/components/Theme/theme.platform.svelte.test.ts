// What Theme owns for the platform: the CSP nonce on everything it injects (CX-8), the portal
// container and shadow roots (CX-12), and the keyboard inset variable (OV-INFRA-7).
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getCspNonce } from '$lib/utils/cspNonce.js';
import { portal } from '$lib/attachments/portal.js';
import { compileThemeBlockingScript, compileViewportScript, disableAnimation } from './helper.js';
import ThemePlatformHarness from './ThemePlatformHarness.test.svelte';
import ThemePortalHostHarness from './ThemePortalHostHarness.test.svelte';
import type { ThemeState } from './theme.state.svelte.js';

const layer = (container: ParentNode) =>
	container.querySelector('[data-slot="floating-window-layer"]');

afterEach(() => {
	document.head.querySelectorAll('style, script').forEach((node) => node.remove());
});

describe('Theme nonce (CX-8)', () => {
	test('every script and style Theme injects while rendering carries it', () => {
		render(ThemePlatformHarness, { props: { nonce: 'abc123' } });

		const injected = document.head.querySelectorAll('script, style');
		expect(injected.length).toBeGreaterThan(0);
		for (const element of injected) expect(element).toHaveAttribute('nonce', 'abc123');
	});

	test('injects nothing with a nonce attribute when none is given', () => {
		render(ThemePlatformHarness);
		expect(document.head.querySelectorAll('[nonce]')).toHaveLength(0);
	});

	test('the blocking theme script and the transition suppressor are stamped', async () => {
		const script = compileThemeBlockingScript({
			validThemes: ['light', 'dark'],
			storageKey: 'theme',
			systemTheme: true,
			syncColorScheme: true,
			defaultTheme: 'light',
			attribute: 'data-theme',
			nonce: 'n1'
		});
		expect(script.startsWith('<script nonce="n1">')).toBe(true);

		const restore = disableAnimation('n2');
		const style = document.head.querySelector('style');
		expect(style).toHaveAttribute('nonce', 'n2');
		restore();
		// The style leaves the head on a timer; let it, before the next test clears the head.
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(document.head.querySelector('style')).toBeNull();
	});

	test('transitionOnChange={false} suppresses transitions with a nonced style around a theme switch', async () => {
		vi.useFakeTimers();
		try {
			let theme: ThemeState | undefined;
			render(ThemePlatformHarness, {
				props: { nonce: 'switch', transitionOnChange: false, onTheme: (state) => (theme = state) }
			});
			flushSync();
			vi.runAllTimers();

			const added: Element[] = [];
			const observer = new MutationObserver((records) => {
				for (const record of records) {
					for (const node of record.addedNodes) {
						if (node instanceof HTMLStyleElement) added.push(node);
					}
				}
			});
			observer.observe(document.head, { childList: true });
			theme!.theme = theme!.resolvedTheme === 'dark' ? 'light' : 'dark';
			flushSync();
			await Promise.resolve();
			observer.disconnect();

			const suppressor = added.find((style) => style.textContent?.includes('transition:none'));
			expect(suppressor).toBeDefined();
			expect(suppressor).toHaveAttribute('nonce', 'switch');
			vi.runAllTimers();
			expect(document.head.contains(suppressor!)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	test('turning transitionOnChange off later leaves no suppressing style behind', async () => {
		const { rerender, unmount } = render(ThemePlatformHarness, {
			props: { nonce: 'toggle', transitionOnChange: true }
		});
		flushSync();
		await rerender({ nonce: 'toggle', transitionOnChange: false });
		flushSync();
		await new Promise((resolve) => setTimeout(resolve, 50));
		const leaked = Array.from(document.head.querySelectorAll('style')).filter((style) =>
			style.textContent?.includes('transition:none')
		);
		expect(leaked).toHaveLength(0);
		unmount();
	});

	test('non-component code reads the nonce of the mounted Theme', () => {
		expect(getCspNonce()).toBeUndefined();
		const { unmount } = render(ThemePlatformHarness, { props: { nonce: 'registry' } });
		expect(getCspNonce()).toBe('registry');
		unmount();
		expect(getCspNonce()).toBeUndefined();
	});
});

describe('portal container (CX-12)', () => {
	test('mounts the portaled layer in document.body by default', () => {
		render(ThemePlatformHarness);
		expect(layer(document.body)?.parentElement).toBe(document.body);
	});

	test('mounts it in the Theme portalContainer element', () => {
		const container = document.createElement('div');
		document.body.append(container);
		render(ThemePlatformHarness, { props: { portalContainer: container } });
		expect(layer(container)).not.toBeNull();
		expect(layer(container)?.parentElement).toBe(container);
		container.remove();
	});

	test('accepts a function for a container that does not exist at render time', () => {
		const late: { container?: HTMLElement } = {};
		render(ThemePlatformHarness, { props: { portalContainer: () => late.container } });
		expect(layer(document.body)?.parentElement).toBe(document.body);

		const container = (late.container = document.createElement('div'));
		document.body.append(container);
		const node = document.createElement('div');
		const detach = portal()(node) as () => void;
		expect(node.parentElement).toBe(container);
		detach();
		container.remove();
	});

	test('moves the layer into a container that appears after the Theme mounted', async () => {
		const { getByTestId } = render(ThemePortalHostHarness);
		flushSync();
		await Promise.resolve();
		const host = getByTestId('host');
		expect(layer(host)).not.toBeNull();
		expect(layer(host)?.parentElement).toBe(host);
	});

	test('a Theme inside a shadow root portals into that root', () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		render(ThemePlatformHarness, { target: shadow });
		expect(layer(shadow)).not.toBeNull();
		expect(layer(shadow)?.parentNode).toBe(shadow);
		host.remove();
	});

	test('an explicit target still wins', () => {
		const target = document.createElement('section');
		document.body.append(target);
		const node = document.createElement('div');
		const detach = portal(target)(node) as () => void;
		expect(node.parentElement).toBe(target);
		detach();
		expect(node.isConnected).toBe(false);
		target.remove();
	});
});

describe('keyboard inset (OV-INFRA-7)', () => {
	type Listener = () => void;
	type Viewport = { height: number; offsetTop: number; scale: number };
	const runViewportScript = (
		visualViewport: Viewport | undefined,
		innerHeight: number,
		clientHeight = 0
	) => {
		const listeners = new Map<string, Listener[]>();
		const track = (type: string, listener: Listener) =>
			listeners.set(type, [...(listeners.get(type) ?? []), listener]);
		const properties = new Map<string, string>();
		const fakeWindow = {
			innerHeight,
			innerWidth: 400,
			visualViewport:
				visualViewport &&
				Object.assign(visualViewport, {
					addEventListener: (type: string, listener: Listener) => track(`vv:${type}`, listener)
				}),
			addEventListener: (type: string, listener: Listener) => track(`window:${type}`, listener)
		};
		const fakeDocument = {
			documentElement: {
				clientHeight,
				style: { setProperty: (name: string, value: string) => properties.set(name, value) }
			}
		};
		new Function('window', 'document', compileViewportScript())(fakeWindow, fakeDocument);
		const fire = (type: string) => listeners.get(type)?.forEach((listener) => listener());
		return { properties, fire, visualViewport: visualViewport as Viewport };
	};

	test('is the part of the layout viewport the visual viewport leaves uncovered', () => {
		const { properties, fire, visualViewport } = runViewportScript(
			{ height: 500, offsetTop: 0, scale: 1 },
			800
		);
		expect(properties.get('--keyboard-inset')).toBe('300px');
		visualViewport.height = 800;
		fire('vv:resize');
		expect(properties.get('--keyboard-inset')).toBe('0px');
	});

	test('follows the visual viewport as it scrolls inside the layout viewport', () => {
		const { properties, fire, visualViewport } = runViewportScript(
			{ height: 500, offsetTop: 100, scale: 1 },
			800
		);
		expect(properties.get('--keyboard-inset')).toBe('200px');
		visualViewport.offsetTop = 300;
		fire('vv:scroll');
		expect(properties.get('--keyboard-inset')).toBe('0px');
	});

	test('publishes how far the visual viewport is scrolled into the layout viewport', () => {
		const { properties, fire, visualViewport } = runViewportScript(
			{ height: 500, offsetTop: 0, scale: 1 },
			800
		);
		expect(properties.get('--visual-viewport-top')).toBe('0px');
		visualViewport.offsetTop = 240;
		fire('vv:scroll');
		expect(properties.get('--visual-viewport-top')).toBe('240px');
		expect(properties.get('--keyboard-inset')).toBe('60px');
	});

	test('measures the layout viewport from the root when innerHeight shrinks with the keyboard', () => {
		// iOS 26: innerHeight follows the visual viewport, the root keeps the fixed layout height.
		const { properties } = runViewportScript({ height: 377, offsetTop: 0, scale: 1 }, 377, 714);
		expect(properties.get('--keyboard-inset')).toBe('337px');
	});

	test('stays 0px while pinch-zoomed and without a visual viewport', () => {
		expect(
			runViewportScript({ height: 400, offsetTop: 0, scale: 2 }, 800).properties.get(
				'--keyboard-inset'
			)
		).toBe('0px');
		expect(runViewportScript(undefined, 800).properties.get('--keyboard-inset')).toBe('0px');
		expect(
			runViewportScript({ height: 400, offsetTop: 200, scale: 2 }, 800).properties.get(
				'--visual-viewport-top'
			)
		).toBe('0px');
	});

	describe('iOS focus zoom', () => {
		const runWithViewportMeta = (userAgent: string, content: string, maxTouchPoints = 5) => {
			const meta = { content };
			new Function('window', 'document', compileViewportScript())(
				{
					innerHeight: 800,
					innerWidth: 400,
					navigator: { userAgent, platform: 'iPhone', maxTouchPoints },
					addEventListener: () => {}
				},
				{
					documentElement: { clientHeight: 800, style: { setProperty: () => {} } },
					querySelector: (selector: string) => (selector === 'meta[name="viewport"]' ? meta : null)
				}
			);
			return meta.content;
		};
		const iPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15';

		test('caps the scale on iOS, so Safari does not zoom into a focused field', () => {
			expect(runWithViewportMeta(iPhone, 'width=device-width, initial-scale=1')).toBe(
				'width=device-width, initial-scale=1, maximum-scale=1'
			);
		});

		test("keeps the page's own maximum-scale and leaves other platforms alone", () => {
			expect(runWithViewportMeta(iPhone, 'width=device-width, maximum-scale=5')).toBe(
				'width=device-width, maximum-scale=5'
			);
			expect(
				runWithViewportMeta('Mozilla/5.0 (Linux; Android 15) Chrome/140', 'width=device-width', 5)
			).toBe('width=device-width');
		});
	});

	test('keeps the existing window size variables', () => {
		const { properties } = runViewportScript({ height: 500, offsetTop: 0, scale: 1 }, 800);
		expect(properties.get('--window-height')).toBe('500px');
		expect(properties.get('--window-width')).toBe('400px');
	});
});
