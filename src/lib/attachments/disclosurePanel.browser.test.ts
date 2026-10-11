// disclosurePanel in real engines: `hidden="until-found"` layout and reveal, and the Web Animations
// height animation, which jsdom can neither lay out nor play.
import { afterEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DisclosurePanelHarness from './DisclosurePanelHarness.test.svelte';

// 100px of content, 8px block padding and a 1px border: 118px open.
const PANEL_STYLE = 'padding: 8px 0; border: 1px solid';
const NATURAL_HEIGHT = 118;
// `hidden="until-found"` only hides the content (`content-visibility: hidden`); the panel's own
// box stays laid out, so these panels keep their padding and border on the content inside.
const FINDABLE_PANEL_STYLE = 'margin: 0';
const FINDABLE_HEIGHT = 100;

const panel = () => page.getByTestId('panel').element() as HTMLElement;
const height = () => panel().getBoundingClientRect().height;
const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const toggle = () => userEvent.click(page.getByRole('button', { name: 'Toggle' }));
// A synchronous click, for measuring the frame right before and after a change.
const toggleNow = () =>
	(page.getByRole('button', { name: 'Toggle' }).element() as HTMLElement).click();

afterEach(() => {
	// Fragment navigations below leave a hash on the test page.
	history.replaceState(null, '', location.pathname + location.search);
});

test('a closed hiddenUntilFound panel takes no space and opens at once on a fragment navigation', async () => {
	const onBeforeMatch = vi.fn();
	const onAfterOpen = vi.fn();
	await render(DisclosurePanelHarness, {
		props: {
			hiddenUntilFound: true,
			panelStyle: FINDABLE_PANEL_STYLE,
			motion: { in: { duration: 400 } },
			onBeforeMatch,
			onAfterOpen
		}
	});
	expect(panel().getAttribute('hidden')).toBe('until-found');
	expect(height()).toBe(0);

	// Navigating to an element inside the panel fires `beforematch`, like find-in-page does.
	location.hash = '#disclosure-secret';
	await expect.poll(() => onAfterOpen.mock.calls.length).toBe(1);
	expect(onBeforeMatch).toHaveBeenCalledOnce();
	expect(panel().hasAttribute('hidden')).toBe(false);
	expect(panel().hasAttribute('data-open')).toBe(true);
	// Revealed without animation: the match is laid out at full height straight away.
	expect(height()).toBe(FINDABLE_HEIGHT);
	expect(panel().getAnimations()).toHaveLength(0);
});

test('a refused find-in-page open hides the content again, still findable', async () => {
	const onAfterOpen = vi.fn();
	await render(DisclosurePanelHarness, {
		props: {
			hiddenUntilFound: true,
			refuseOpen: true,
			panelStyle: FINDABLE_PANEL_STYLE,
			onAfterOpen
		}
	});
	location.hash = '#disclosure-secret';
	await expect.poll(() => panel().getAttribute('hidden')).toBe('until-found');
	await expect.poll(height).toBe(0);
	expect(panel().hasAttribute('data-closed')).toBe(true);
	expect(onAfterOpen).not.toHaveBeenCalled();
});

test('opening animates the height from 0 and reports once when the animation ends', async () => {
	const onAfterOpen = vi.fn();
	await render(DisclosurePanelHarness, {
		props: {
			keepMounted: true,
			panelStyle: PANEL_STYLE,
			motion: { in: { duration: 300, easing: 'linear' } },
			onAfterOpen
		}
	});
	expect(height()).toBe(0);
	await toggle();
	await nextFrame();
	await nextFrame();
	const midway = height();
	expect(midway).toBeGreaterThan(0);
	expect(midway).toBeLessThan(NATURAL_HEIGHT);
	expect(panel().hasAttribute('data-entering')).toBe(true);
	// The variable holds the measured `height` (border-box under the docs stylesheet).
	expect(panel().style.getPropertyValue('--disclosure-panel-height')).toBe(`${NATURAL_HEIGHT}px`);
	expect(onAfterOpen).not.toHaveBeenCalled();

	await expect.poll(() => onAfterOpen.mock.calls.length).toBe(1);
	expect(height()).toBe(NATURAL_HEIGHT);
	expect(panel().hasAttribute('data-entering')).toBe(false);
	expect(panel().style.getPropertyValue('--disclosure-panel-height')).toBe('auto');
	expect(panel().style.overflow).toBe('');
	expect(panel().getAnimations()).toHaveLength(0);
});

test('a close during the open reverses from the current height and reports only the close', async () => {
	const onAfterOpen = vi.fn();
	const onAfterClose = vi.fn();
	await render(DisclosurePanelHarness, {
		props: {
			keepMounted: true,
			panelStyle: PANEL_STYLE,
			motion: { in: { duration: 600, easing: 'linear' }, out: { duration: 300, easing: 'linear' } },
			onAfterOpen,
			onAfterClose
		}
	});
	await toggle();
	await expect.poll(height).toBeGreaterThan(30);
	await nextFrame();
	const before = height();
	toggleNow();
	await nextFrame();
	const after = height();
	await nextFrame();
	const later = height();
	// No jump to full height or to zero: the collapse continues from where the open was (the open
	// grows about 3px a frame), then shrinks.
	expect(Math.abs(after - before)).toBeLessThan(8);
	expect(later).toBeLessThan(after);
	expect(later).toBeGreaterThan(0);
	expect(panel().hasAttribute('data-exiting')).toBe(true);

	await expect.poll(() => onAfterClose.mock.calls.length).toBe(1);
	expect(onAfterOpen).not.toHaveBeenCalled();
	await expect.poll(() => panel().hasAttribute('hidden')).toBe(true);
	expect(height()).toBe(0);
	expect(panel().getAnimations()).toHaveLength(0);
});
