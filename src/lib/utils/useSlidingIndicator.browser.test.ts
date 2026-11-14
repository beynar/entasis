// The sliding indicator covers its item exactly in real engines (Chromium and WebKit), also when
// the item sits at a fractional offset and width that `offsetLeft`/`offsetWidth` would round.
import { describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import Harness from './SlidingIndicatorHarness.test.svelte';

/** The indicator's box from its own style, in its container's padding box. */
const styledBox = (indicator: HTMLElement) => {
	const [, x, y] = indicator.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) ?? [];
	return {
		x: Number(x),
		y: Number(y),
		width: parseFloat(indicator.style.width),
		height: parseFloat(indicator.style.height)
	};
};

/** The item's box in the same padding box, from layout. */
const layoutBox = (item: HTMLElement, container: HTMLElement) => {
	const box = item.getBoundingClientRect();
	const frame = container.getBoundingClientRect();
	return {
		x: box.left - frame.left - container.clientLeft,
		y: box.top - frame.top - container.clientTop,
		width: box.width,
		height: box.height
	};
};

const expectCovers = (indicator: HTMLElement, item: HTMLElement, container: HTMLElement) => {
	const styled = styledBox(indicator);
	const layout = layoutBox(item, container);
	// The item really has a fractional width, or the test proves nothing.
	expect(layout.width % 1).not.toBe(0);
	for (const side of ['x', 'y', 'width', 'height'] as const) {
		expect(Math.abs(styled[side] - layout[side]), side).toBeLessThan(0.02);
	}
};

describe('fractional indicator placement', () => {
	test('SegmentedControl', async () => {
		await render(Harness);
		await nextFrame();
		const group = page.getByRole('radiogroup', { name: 'Segments' }).element() as HTMLElement;
		const indicator = group.querySelector<HTMLElement>('span[aria-hidden="true"][style]');
		expect(indicator).not.toBeNull();
		expectCovers(indicator!, group.querySelector('[aria-checked="true"]')!, group);
	});

	test('Tabbar', async () => {
		await render(Harness);
		await nextFrame();
		const list = page.getByRole('tablist', { name: 'Tabs' }).element() as HTMLElement;
		const indicator = list.querySelector<HTMLElement>('[data-slot="tabbar-indicator"][style]');
		expect(indicator).not.toBeNull();
		expectCovers(indicator!, list.querySelector('[aria-selected="true"]')!, list);
	});
});
