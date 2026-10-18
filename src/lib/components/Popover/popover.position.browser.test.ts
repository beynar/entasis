// Real placement through `popover.position.ts` in Chromium and WebKit: floating-ui measures real
// boxes here, so these tests pin the gap, flipping, shifting and scroll tracking of a panel, the
// CSS variables and pixel snapping it writes, logical sides, right-to-left documents, hidden
// anchors, line anchoring, and a list that shrinks to the room beside its input.
import { afterEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled, nextFrame } from '$lib/testing/browser.test-helper.js';
import {
	computePanelPosition,
	createPanelPositioner,
	type PanelPositionerOptions
} from './popover.position.js';
import type { PopoverPlacement } from './popover.props.js';
import PopoverCapHarness from './PopoverCapHarness.test.svelte';
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

const positioner = (
	reference: HTMLElement,
	placement: PopoverPlacement = 'bottom-start',
	overrides: Partial<PanelPositionerOptions> = {}
) => {
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
		onPlace,
		...overrides
	});
	return { ...instance, onPlace };
};

const panelBox = () => fixedBox({ top: 0, left: 0, width: 200, height: 100 });
// Text line boxes can end on a half pixel (WebKit on Linux), while panels are placed on whole
// pixels: allow one pixel either way where a panel is measured against a line of text.
const expectWithinPixel = (actual: number, expected: number) =>
	expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

const initialViewport = { width: window.innerWidth, height: window.innerHeight };

afterEach(async () => {
	document.body.replaceChildren();
	document.documentElement.removeAttribute('dir');
	window.scrollTo(0, 0);
	if (window.innerWidth !== initialViewport.width || window.innerHeight !== initialViewport.height)
		await page.viewport(initialViewport.width, initialViewport.height);
});

test('a panel that fits below its reference sits 4px under it, start-aligned', async () => {
	const reference = fixedBox({ top: 100, left: 100, width: 80, height: 32 });
	const panel = panelBox();
	const { place, onPlace } = positioner(reference);
	await place(panel);
	const box = panel.getBoundingClientRect();
	expect(box.top).toBeCloseTo(136, 0);
	expect(box.left).toBeCloseTo(100, 0);
	expect(onPlace).toHaveBeenCalledWith(
		expect.objectContaining({ panel, placement: 'bottom-start', mount: false })
	);
});

test('a reference near the viewport bottom flips the panel above it', async () => {
	const reference = fixedBox({ top: window.innerHeight - 60, left: 100, width: 80, height: 32 });
	const panel = panelBox();
	const { place, onPlace } = positioner(reference);
	await place(panel);
	const box = panel.getBoundingClientRect();
	expect(box.bottom).toBeCloseTo(window.innerHeight - 64, 0);
	expect(box.left).toBeCloseTo(100, 0);
	expect(onPlace).toHaveBeenCalledWith(
		expect.objectContaining({ panel, placement: 'top-start', side: 'top', mount: false })
	);
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
	expect(panel).toHaveAttribute('data-side', 'bottom');
});

test('the panel learns the room on its side and the snapped size of its reference', async () => {
	const reference = fixedBox({ top: 100, left: 100.3, width: 80.3, height: 32 });
	const panel = panelBox();
	const { place } = positioner(reference);
	await place(panel);
	const ratio = window.devicePixelRatio;
	const onGrid = (value: string) =>
		Number.isInteger(Math.round(parseFloat(value) * ratio * 1e6) / 1e6);
	// Below the reference: viewport height - 20px padding - (100 + 32 + 4).
	expect(parseFloat(panel.style.getPropertyValue('--available-height'))).toBeCloseTo(
		window.innerHeight - 20 - 136,
		0
	);
	expect(onGrid(panel.style.getPropertyValue('--anchor-width'))).toBe(true);
	expect(panel.style.getPropertyValue('--anchor-height')).toBe('32px');
	expect(onGrid(panel.style.left)).toBe(true);
	expect(onGrid(panel.style.top)).toBe(true);
});

test('a reference scrolled out of its container hides the panel until it scrolls back', async () => {
	const scroller = fixedBox({ top: 100, left: 100, width: 200, height: 100 });
	scroller.style.overflow = 'auto';
	const content = document.createElement('div');
	content.style.height = '600px';
	const reference = document.createElement('button');
	reference.textContent = 'Reference';
	content.append(reference);
	scroller.append(content);
	const panel = panelBox();
	const { track, onPlace } = positioner(reference);
	const stop = track(panel, reference, () => {});
	await expect.poll(() => panel.style.visibility).toBe('');

	scroller.scrollTop = 300;
	await expect.poll(() => panel.style.visibility).toBe('hidden');
	expect(onPlace).toHaveBeenLastCalledWith(expect.objectContaining({ anchorHidden: true }));

	scroller.scrollTop = 0;
	await expect.poll(() => panel.style.visibility).toBe('');
	expect(onPlace).toHaveBeenLastCalledWith(expect.objectContaining({ anchorHidden: false }));
	stop();
});

test.each([
	['ltr', 'right'],
	['rtl', 'left']
] as const)('inline-end in a %s document opens on the %s', async (direction, side) => {
	const reference = fixedBox({ top: 200, left: 300, width: 80, height: 32 });
	const panel = panelBox();
	const { place, onPlace } = positioner(reference, 'inline-end', { direction: () => direction });
	await place(panel);
	const box = panel.getBoundingClientRect();
	if (side === 'right') expect(box.left).toBeCloseTo(384, 0);
	else expect(box.right).toBeCloseTo(296, 0);
	expect(onPlace).toHaveBeenCalledWith(
		expect.objectContaining({ placement: side, side: 'inline-end' })
	);
});

test('in a right-to-left document a Popover sits under its trigger, aligned to its right edge', async () => {
	document.documentElement.dir = 'rtl';
	render(PopoverPositionHarness, { props: { position: 'bottom-start', inset: 120 } });
	const inside = page.getByRole('button', { name: 'Inside popover' });
	await expect.element(inside).toBeVisible();
	const trigger = page.getByRole('button', { name: 'Open popover' }).element();
	const panel = inside.element().closest('dialog')!.firstElementChild as HTMLElement;
	await animationsSettled();
	await expect
		.poll(() => panel.getBoundingClientRect().right - trigger.getBoundingClientRect().right)
		.toBeCloseTo(0, 0);
	expect(panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom).toBeCloseTo(
		4,
		0
	);
	// It scales from the corner nearest the trigger: the top right one.
	expect(panel.style.transformOrigin).toBe('right top');
	expect(panel).toHaveAttribute('data-align', 'start');
	expect(trigger).toHaveAttribute('data-popup-side', 'bottom');
});

test('anchorTo line places the panel against the wrapped line that holds the point', async () => {
	const paragraph = document.createElement('p');
	Object.assign(paragraph.style, {
		position: 'fixed',
		top: '200px',
		left: '100px',
		// Twenty characters a line: "wrapped" ends the first line and "link" starts the second.
		width: '20ch',
		margin: '0',
		font: '16px/20px monospace'
	});
	const link = document.createElement('a');
	link.href = '#';
	link.textContent = 'wrapped link';
	paragraph.append('xxxxxxxxxx ', link);
	document.body.append(paragraph);
	const [first, last] = Array.from(link.getClientRects());
	expect(last.top).toBeGreaterThan(first.top);

	const panel = panelBox();
	let point = { x: last.left + 2, y: last.top + last.height / 2 };
	const { place } = positioner(link, 'bottom-start', {
		anchorTo: () => 'line',
		anchorPoint: () => point
	});
	await place(panel);
	expectWithinPixel(panel.getBoundingClientRect().top, last.bottom + 4);
	expectWithinPixel(panel.getBoundingClientRect().left, last.left);

	point = { x: first.left + 2, y: first.top + first.height / 2 };
	await place(panel);
	expectWithinPixel(panel.getBoundingClientRect().top, first.bottom + 4);
	expectWithinPixel(panel.getBoundingClientRect().left, first.left);
});

test('anchorTo line follows the pointer even when the wrapped lines overlap horizontally', async () => {
	const paragraph = document.createElement('p');
	Object.assign(paragraph.style, {
		position: 'fixed',
		top: '200px',
		left: '100px',
		width: '22ch',
		margin: '0',
		font: '16px/20px monospace'
	});
	const link = document.createElement('a');
	link.href = '#';
	// "xxxxx " leads, so line 1 of the link spans columns 6-21 and line 2 columns 0-12: they overlap.
	link.textContent = 'aaaaaaaaaaaaaaa bbbbbbbbbbbb';
	paragraph.append('xxxxx ', link);
	document.body.append(paragraph);
	const [first, last] = Array.from(link.getClientRects());
	expect(last.top).toBeGreaterThan(first.top);
	expect(last.right).toBeGreaterThan(first.left);

	const panel = panelBox();
	let point = { x: first.left + 4, y: first.top + first.height / 2 };
	const { place } = positioner(link, 'bottom-start', {
		anchorTo: () => 'line',
		anchorPoint: () => point
	});
	await place(panel);
	expectWithinPixel(panel.getBoundingClientRect().top, first.bottom + 4);
	expectWithinPixel(panel.getBoundingClientRect().left, first.left);

	point = { x: last.left + 4, y: last.top + last.height / 2 };
	await place(panel);
	expectWithinPixel(panel.getBoundingClientRect().top, last.bottom + 4);
	expectWithinPixel(panel.getBoundingClientRect().left, last.left);
});

test('a list with no room for its full height shrinks to the room below its input instead of covering it', async () => {
	await page.viewport(800, 320);
	render(PopoverCapHarness, { props: { top: 140 } });
	await userEvent.click(page.getByPlaceholder('Pick an option'));
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();
	const anchor = document.querySelector<HTMLElement>('[data-popup-side]')!;
	await expect.poll(() => anchor?.getAttribute('data-popup-side')).toBe('bottom');
	// The positioning wrapper: a <dialog> for dialog content, a plain element for a listbox.
	let wrapper = listbox.element() as HTMLElement;
	while (getComputedStyle(wrapper).position !== 'fixed') wrapper = wrapper.parentElement!;
	await expect
		.poll(() => wrapper.getBoundingClientRect().bottom)
		.toBeLessThanOrEqual(window.innerHeight - 20 + 1);
	expect(wrapper.getBoundingClientRect().top).toBeGreaterThanOrEqual(
		anchor.getBoundingClientRect().bottom
	);
	// The last options are scrolled out of the shrunk list.
	const last = page.getByRole('option', { name: 'Option 30' }).element();
	expect(last.getBoundingClientRect().top).toBeGreaterThan(wrapper.getBoundingClientRect().bottom);
});

test('a submenu with no room beside it and 9px too little below falls to the cross axis below, never over its menu', async () => {
	await page.viewport(800, 800);
	// A wide menu near the left edge leaves no room beside its submenu row, which sits low:
	// the panel overflows the space below by 9px, yet plenty of room is left above the row.
	const row = fixedBox({ top: 586, left: 42, width: 700, height: 28 });
	const panel = fixedBox({ top: 0, left: 0, width: 240, height: 171 });
	const { placement, y } = await computePanelPosition(row, panel, {
		placement: 'right-start',
		fallbackAxisSide: 'end'
	});
	expect(placement).toBe('bottom-start');
	// Slid up by shift to stay in the viewport, but it still starts inside the row, not above it.
	expect(y).toBeGreaterThanOrEqual(row.getBoundingClientRect().top);
	expect(y + 171).toBeLessThanOrEqual(800 - 20 + 1);
});
