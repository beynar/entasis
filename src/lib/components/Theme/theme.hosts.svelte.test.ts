// `<Theme>` mounts the dialog backdrop and the tooltip surface for the pages that use them: each is
// registered by the first dialog or tooltip, so a page with neither does not carry their code
// (`check:bundle-absent` holds the import graph to that).
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import DialogBackdrop from '../Dialog/DialogBackdrop.svelte';
import TooltipHost from '../Tooltip/TooltipHost.svelte';
import Harness from './ThemeHostsHarness.test.svelte';
import type { ThemeState } from './theme.state.svelte.js';

function mountPage(props: Record<string, unknown> = {}) {
	let theme!: ThemeState;
	const view = render(Harness, {
		props: {
			...props,
			report: (state: ThemeState) => {
				theme = state;
				return true as const;
			}
		}
	});
	flushSync();
	return { theme, view };
}

describe('Theme hosts', () => {
	test('a page without dialogs or tooltips mounts neither host', () => {
		const { theme } = mountPage();
		expect(theme.hosts).toEqual([]);
		expect(theme.clientHosts).toEqual([]);
		expect(theme.tooltipId).toBeNull();
	});

	test('tooltips share one surface, mounted for the first of them', () => {
		const { theme } = mountPage({ tooltips: 3, tooltipComponent: true });
		expect(theme.clientHosts).toEqual([TooltipHost]);
		expect(theme.hosts).toEqual([]);
		// The surface is there: triggers can point `aria-describedby` at it.
		expect(theme.tooltipId).not.toBeNull();
	});

	test('dialogs share one backdrop, mounted for the first of them', () => {
		const { theme } = mountPage({ dialogs: 2 });
		expect(theme.hosts).toEqual([DialogBackdrop]);
		expect(theme.clientHosts).toEqual([]);
		expect(document.querySelector('[data-dialog-backdrop]')).toBeNull();
	});

	test('a host arrives with the first dialog or tooltip added after the page mounted', async () => {
		const { theme, view } = mountPage();
		await view.rerender({ tooltips: 1, dialogs: 1, defaultOpen: true });
		flushSync();
		expect(theme.clientHosts).toEqual([TooltipHost]);
		expect(theme.hosts).toEqual([DialogBackdrop]);
		expect(document.querySelector('[data-dialog-backdrop]')).not.toBeNull();
	});

	test('a host is registered once, whoever asks again', () => {
		const { theme } = mountPage({ dialogs: 1 });
		theme.mountHost(DialogBackdrop);
		theme.mountHost(TooltipHost, { clientOnly: true });
		theme.mountHost(TooltipHost, { clientOnly: true });
		expect(theme.hosts).toEqual([DialogBackdrop]);
		expect(theme.clientHosts).toEqual([TooltipHost]);
	});
});
