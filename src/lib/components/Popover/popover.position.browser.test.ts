// Real placement through `popover.position.ts` in Chromium and WebKit: floating-ui measures real
// boxes here, so these tests pin the gap, flipping, shifting and scroll tracking of a panel.
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { Placement } from '@floating-ui/dom';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import { createPanelPositioner, type PanelPositionerOptions } from './popover.position.js';
import PopoverPositionHarness from './PopoverPositionHarness.test.svelte';

const fixedBox = (rect: { top: number; left: number; width: number; height: number }) => {
	const element = document.createElement('div');
	Object.assign(element.style, {
		position: 'fixed',
		top: `${rect.top}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`,
		height: `${rect.height}px`
	});
	document.body.append(element);
	return element;
};

const positioner = (reference: HTMLElement, placement: Placement = 'bottom-start') => {
	const onPlace = vi.fn<PanelPositionerOptions['onPlace']>();
	const instance = createPanelPositioner({
		reference: () => reference,
		floating: () => true,
		settled: () => true,
		placement: () => placement,
		offset: () => undefined,
		fitTrigger: () => false,
		positionPanel: () => undefined,
		setMinWidth: () => {},
		onPlace
	});
	return { ...instance, onPlace };
};

const panelBox = () => fixedBox({ top: 0, left: 0, width: 200, height: 100 });

afterEach(() => {
	document.body.replaceChildren();
	window.scrollTo(0, 0);
});

test('a panel that fits below its reference sits 4px under it, start-aligned', async () => {
	const reference = fixedBox({ top: 100, left: 100, width: 80, height: 32 });
	const panel = panelBox();
	const { place, onPlace } = positioner(reference);
	await place(panel);
	const box = panel.getBoundingClientRect();
	expect(box.top).toBeCloseTo(136, 0);
	expect(box.left).toBeCloseTo(100, 0);
	expect(onPlace).toHaveBeenCalledWith({ panel, placement: 'bottom-start', mount: false });
});

test('a reference near the viewport bottom flips the panel above it', async () => {
	const reference = fixedBox({ top: window.innerHeight - 60, left: 100, width: 80, height: 32 });
	const panel = panelBox();
	const { place, onPlace } = positioner(reference);
	await place(panel);
	const box = panel.getBoundingClientRect();
	expect(box.bottom).toBeCloseTo(window.innerHeight - 64, 0);
	expect(box.left).toBeCloseTo(100, 0);
	expect(onPlace).toHaveBeenCalledWith({ panel, placement: 'top-start', mount: false });
});

test('a reference near the inline end shifts the panel 20px inside the viewport', async () => {
	const reference = fixedBox({ top: 100, left: window.innerWidth - 50, width: 40, height: 32 });
	const panel = panelBox();
	const { place } = positioner(reference);
	await place(panel);
	expect(panel.getBoundingClientRect().right).toBeCloseTo(window.innerWidth - 20, 0);
});

test('a tracked panel follows its reference when the page scrolls', async () => {
	const spacer = document.createElement('div');
	spacer.style.height = '4000px';
	document.body.append(spacer);
	const reference = document.createElement('button');
	Object.assign(reference.style, { position: 'absolute', top: '300px', left: '100px' });
	reference.textContent = 'Reference';
	document.body.append(reference);
	const panel = panelBox();
	const { track } = positioner(reference);
	const stop = track(panel, reference, () => {});
	await expect.poll(() => panel.style.visibility).toBe('');
	const below = () => panel.getBoundingClientRect().top - reference.getBoundingClientRect().bottom;
	expect(below()).toBeCloseTo(4, 0);

	window.scrollTo(0, 150);
	await nextFrame();
	await expect.poll(below).toBeCloseTo(4, 0);
	expect(reference.getBoundingClientRect().top).toBeCloseTo(150, 0);
	stop();
});

test('a Popover with no room above its trigger flips below and scales from the top edge', async () => {
	render(PopoverPositionHarness, { props: { position: 'top-start' } });
	const inside = page.getByRole('button', { name: 'Inside popover' });
	await expect.element(inside).toBeVisible();
	const trigger = page.getByRole('button', { name: 'Open popover' }).element();
	const panel = inside.element().closest('dialog')!.firstElementChild as HTMLElement;
	await expect
		.poll(() => panel.getBoundingClientRect().top >= trigger.getBoundingClientRect().bottom)
		.toBe(true);
	// The trigger sits at the page's start edge, so the cross axis may resolve to either
	// alignment; the side is what the flip decides.
	expect(panel.style.transformOrigin).toMatch(/^(left|right|center) top$/);
});
