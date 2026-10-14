// ScrollArea focus behaviour that needs a real engine: browsers move focus to <body> when the
// focused element stops being focusable, which jsdom does not model.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ScrollAreaHarness from './ScrollAreaHarness.test.svelte';
import ScrollAreaHooksHarness from './ScrollAreaHooksHarness.test.svelte';

test('a focused viewport keeps focus when its content stops overflowing', async () => {
	await render(ScrollAreaHarness, { props: { style: 'height: 40px' } });
	const viewport = document.querySelector<HTMLElement>('[data-scroll-area-viewport]')!;
	const content = viewport.querySelector('p')!;

	content.style.height = '400px';
	await expect.poll(() => viewport.getAttribute('tabindex')).toBe('0');
	await userEvent.tab();
	expect(document.activeElement).toBe(viewport);

	// The content now fits (a resize, a zoom-out, filtered content).
	content.style.height = '10px';
	await expect.poll(() => viewport.getAttribute('tabindex')).not.toBe('0');
	expect(document.activeElement).toBe(viewport);
	expect(viewport).toHaveAttribute('tabindex', '-1');
	expect(viewport).toHaveAttribute('role', 'group');
	expect(viewport).toHaveAttribute('aria-label', 'Scrollable content');

	// Once focus leaves, the idle viewport is a plain element again.
	viewport.blur();
	await expect.poll(() => viewport.hasAttribute('tabindex')).toBe(false);
	expect(viewport).not.toHaveAttribute('role');
	expect(viewport).not.toHaveAttribute('aria-label');
});

// Scrollbar presses, RTL and snapping in a real engine.
const trackOf = (orientation: 'vertical' | 'horizontal') =>
	document.querySelector<HTMLElement>(
		`[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`
	)!;
const thumbOf = (orientation: 'vertical' | 'horizontal') =>
	document.querySelector<HTMLElement>(
		`[data-slot="scroll-area-thumb"][data-orientation="${orientation}"]`
	)!;

test('pressing the scrollbar keeps focus in the control that has it', async () => {
	await render(ScrollAreaHooksHarness, {
		props: { type: 'always', items: 30, style: 'width: 200px; height: 100px' }
	});
	const field = page.getByLabelText('Field').element() as HTMLInputElement;
	field.focus();
	await expect.poll(() => trackOf('vertical')).not.toBeNull();

	await userEvent.click(trackOf('vertical'), { position: { x: 3, y: 90 } });
	expect(document.activeElement).toBe(field);
	// The press still scrolls: a click on the lower track jumps towards the end.
	await expect
		.poll(() => document.querySelector('[data-scroll-area-viewport]')!.scrollTop)
		.toBeGreaterThan(0);

	await userEvent.click(thumbOf('vertical'));
	expect(document.activeElement).toBe(field);
});

test('dragging the thumb pauses scroll snapping and follows the pointer', async () => {
	await render(ScrollAreaHooksHarness, {
		props: { type: 'always', items: 30, style: 'width: 200px; height: 100px' }
	});
	const viewport = document.querySelector<HTMLElement>('[data-scroll-area-viewport]')!;
	viewport.style.scrollSnapType = 'y mandatory';
	for (const row of viewport.querySelectorAll<HTMLElement>('p'))
		row.style.scrollSnapAlign = 'start';
	await expect.poll(() => trackOf('vertical')).not.toBeNull();

	const track = trackOf('vertical').getBoundingClientRect();
	const handle = thumbOf('vertical').getBoundingClientRect();
	const maxScroll = viewport.scrollHeight - viewport.clientHeight;
	const travel = track.height - handle.height;

	// What the viewport looks like at the moment the pointer is released, before the drag lets go.
	let atRelease: { snap: string; top: number } | null = null;
	const record = () =>
		(atRelease = { snap: viewport.style.scrollSnapType, top: viewport.scrollTop });
	window.addEventListener('pointerup', record, { capture: true, once: true });

	await userEvent.dragAndDrop(thumbOf('vertical'), trackOf('vertical'), {
		sourcePosition: { x: 3, y: handle.height / 2 },
		targetPosition: { x: 3, y: handle.height / 2 + travel * 0.37 }
	});
	expect(atRelease!.snap).toBe('none');
	// A point no row edge sits on: the viewport is where the pointer put the thumb.
	expect(Math.abs(atRelease!.top - maxScroll * 0.37)).toBeLessThan(8);
	// The page's own snapping comes back once the thumb is let go.
	expect(viewport.style.scrollSnapType).toBe('y mandatory');
});

test('an RTL viewport scrolls with a negative offset that the thumb follows from the right', async () => {
	await render(ScrollAreaHooksHarness, {
		props: { type: 'always', dir: 'rtl', wide: true, style: 'width: 200px; height: 100px' }
	});
	const viewport = document.querySelector<HTMLElement>('[data-scroll-area-viewport]')!;
	await expect.poll(() => trackOf('horizontal')).not.toBeNull();

	const track = trackOf('horizontal').getBoundingClientRect();
	const handle = () => thumbOf('horizontal').getBoundingClientRect();
	// At rest the thumb sits at the inline start: the right edge of the track.
	expect(Math.abs(handle().right - track.right)).toBeLessThan(1);
	expect(viewport.scrollLeft).toBe(0);

	// Drag it all the way to the left end of the track.
	await userEvent.dragAndDrop(thumbOf('horizontal'), trackOf('horizontal'), {
		sourcePosition: { x: handle().width / 2, y: 3 },
		targetPosition: { x: 1, y: 3 }
	});
	expect(viewport.scrollLeft).toBeLessThan(-100);
	const area = document.querySelector('[data-scroll-area]')!;
	await expect.poll(() => Math.abs(handle().left - track.left)).toBeLessThan(2);
	await expect.poll(() => area.hasAttribute('data-overflow-x-end')).toBe(false);
	expect(area).toHaveAttribute('data-overflow-x-start');
});
