// Menu, MenuBar and the ToggleMenu toolbar against their APG keyboard patterns, left to right and
// right to left, in Chromium and WebKit (see `$lib/testing/apg.test-helper.ts`).
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import MenuBrowserHarness from './MenuBrowserHarness.test.svelte';

type Props = Parameters<typeof MenuBrowserHarness>[1];
const mount = (scenario: Props['scenario'], dir: Props['dir']) =>
	render(MenuBrowserHarness, { props: { scenario, dir } });

describe.each(['ltr', 'rtl'] as const)('APG patterns (%s)', (dir) => {
	test('a popup menu follows the menu button and menu patterns', async () => {
		await mount('popup', dir);
		const trigger = page.getByRole('button', { name: 'File' }).element();
		await checkPattern(trigger, 'menu', { dir });
	});

	test('a menubar follows the menubar pattern', async () => {
		await mount('menubar', dir);
		const menubar = page.getByRole('menubar').element();
		await checkPattern(menubar, 'menubar', { dir });
	});
});
