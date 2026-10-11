// ScrollArea focus behaviour that needs a real engine: browsers move focus to <body> when the
// focused element stops being focusable, which jsdom does not model.
import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ScrollAreaHarness from './ScrollAreaHarness.test.svelte';

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
