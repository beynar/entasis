// Arrow keys follow the direction a list is laid out in (Chromium and WebKit): an island that
// declares its own `dir` wins over the page's i18n direction, in both directions.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import DirectionIslandHarness from './DirectionIslandHarness.test.svelte';

/** The radio ArrowRight moves to from Grid, in the group named `label`. */
const afterArrowRight = async (label: string) => {
	const group = page.getByRole('radiogroup', { name: label });
	(group.getByRole('radio', { name: 'Grid' }).element() as HTMLElement).focus();
	await userEvent.keyboard('{ArrowRight}');
	return document.activeElement?.textContent?.trim();
};

describe('useDirection reads the element before the i18n context', () => {
	test('an LTR island inside an Arabic page keeps unmirrored arrows', async () => {
		await render(DirectionIslandHarness, { page: 'rtl', island: 'ltr' });
		await nextFrame();
		expect(await afterArrowRight('Island')).toBe('Board');
		expect(await afterArrowRight('Page')).toBe('List');
	});

	test('an RTL island inside an English page mirrors its arrows', async () => {
		await render(DirectionIslandHarness, { page: 'ltr', island: 'rtl' });
		await nextFrame();
		expect(await afterArrowRight('Island')).toBe('List');
		expect(await afterArrowRight('Page')).toBe('Board');
	});
});
