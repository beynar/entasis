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
