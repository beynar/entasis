// The rail removes itself in a narrow container: that needs real layout widths.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './AIThreadTocHarness.test.svelte';

const toc = () => document.querySelector<HTMLElement>('[data-slot="ai-thread-toc"]');

test('the rail shows in a wide container and removes itself in a narrow one', async () => {
	const screen = await render(Harness, { props: { width: 720 } });
	await expect.poll(() => toc()?.hidden).toBe(false);
	expect(document.querySelectorAll('[data-slot="ai-thread-toc-pin"]').length).toBe(4);
	await screen.rerender({ width: 360 });
	await expect.poll(() => toc()?.hidden).toBe(true);
	expect(document.querySelectorAll('[data-slot="ai-thread-toc-pin"]').length).toBe(0);
	await screen.rerender({ width: 720 });
	await expect.poll(() => toc()?.hidden).toBe(false);
});

test('minContainerWidth 0 keeps the rail at every width', async () => {
	await render(Harness, { props: { width: 200, minContainerWidth: 0 } });
	await expect.poll(() => toc()?.hidden).toBe(false);
});

test('a new minContainerWidth applies without a resize', async () => {
	const screen = await render(Harness, { props: { width: 400, minContainerWidth: 480 } });
	await expect.poll(() => toc()?.hidden).toBe(true);
	await screen.rerender({ minContainerWidth: 0 });
	await expect.poll(() => toc()?.hidden).toBe(false);
	await screen.rerender({ minContainerWidth: 480 });
	await expect.poll(() => toc()?.hidden).toBe(true);
});

test('an overflowing pin stack is still one tab stop', async () => {
	await render(Harness, { props: { count: 60, activeIndex: 10 } });
	const viewport = () => toc()?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
	await expect
		.poll(() => {
			const node = viewport();
			return node ? node.scrollHeight > node.clientHeight : false;
		})
		.toBe(true);
	const tabStops = Array.from(toc()?.querySelectorAll<HTMLElement>('*') ?? []).filter(
		(node) => node.tabIndex >= 0 && (node.hasAttribute('tabindex') || node.matches('button'))
	);
	expect(tabStops).toHaveLength(1);
	expect(tabStops[0]).toHaveAttribute('data-slot', 'ai-thread-toc-pin');
});
