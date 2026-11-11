// `subheader` is a band between the header and the content: full shell width, outside the content's
// padding, width preset and gap, pinned under the header while the header is sticky.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './PageShellSubheaderHarness.test.svelte';

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const rect = (element: Element) => element.getBoundingClientRect();
const scroller = () => document.querySelector<HTMLElement>('[data-testid="scroller"]')!;

test('it sits between the header and the content, across the whole shell', async () => {
	await render(Harness);
	await expect.poll(() => slot('page-shell-subheader')).not.toBeNull();

	const shell = slot('page-shell')!;
	const header = slot('page-shell-header')!;
	const subheader = slot('page-shell-subheader')!;
	const main = slot('page-shell-content')!;
	expect(header.nextElementSibling).toBe(subheader);
	expect(subheader.nextElementSibling).toBe(main);
	expect(main.contains(subheader)).toBe(false);

	// The shell's width, not the narrow, padded content column.
	expect(rect(subheader).left).toBe(rect(shell).left);
	expect(rect(subheader).width).toBe(rect(shell).width);
	const tabs = document.querySelector('[data-testid="tabs"]')!;
	expect(rect(tabs).width).toBe(rect(shell).width);
	expect(rect(subheader).top).toBe(rect(header).bottom);

	// The content keeps its padding and its gap starts at its own first child, not the band.
	const first = document.querySelector('[data-testid="first"]')!;
	const inner = slot('page-shell-content-inner')!;
	expect(rect(first).width).toBeLessThan(rect(shell).width);
	expect(rect(first).top).toBeGreaterThan(rect(subheader).bottom);
	expect(rect(first).top - rect(subheader).bottom).toBe(
		Number.parseFloat(getComputedStyle(inner).paddingTop)
	);
});

test('it stays pinned under a sticky header while the page scrolls', async () => {
	await render(Harness);
	await expect.poll(() => slot('page-shell-subheader')?.dataset.sticky).toBe('true');

	scroller().scrollTop = 600;
	await expect.poll(() => scroller().scrollTop).toBe(600);
	const header = slot('page-shell-header')!;
	const subheader = slot('page-shell-subheader')!;
	expect(rect(header).top).toBe(rect(scroller()).top);
	expect(rect(subheader).top).toBe(rect(header).bottom);
});

test('it follows the header height when the header grows', async () => {
	const screen = await render(Harness, { props: { title: 'Projects' } });
	await expect.poll(() => slot('page-shell-subheader')?.dataset.sticky).toBe('true');
	const before = rect(slot('page-shell-header')!).height;

	await screen.rerender({ theme: { headerInner: { base: 'min-h-32' } } });
	await expect.poll(() => rect(slot('page-shell-header')!).height).toBeGreaterThan(before);

	scroller().scrollTop = 600;
	await expect
		.poll(() => rect(slot('page-shell-subheader')!).top)
		.toBe(rect(slot('page-shell-header')!).bottom);
});

test('under a header that is not sticky, it scrolls away with the page', async () => {
	await render(Harness, { props: { theme: { header: { base: '!static' } } } });
	await expect.poll(() => slot('page-shell-subheader')).not.toBeNull();
	expect(slot('page-shell-subheader')!.dataset.sticky).toBeUndefined();

	scroller().scrollTop = 600;
	await expect
		.poll(() => rect(slot('page-shell-subheader')!).bottom)
		.toBeLessThan(rect(scroller()).top);
});

test('without a subheader nothing is drawn, and a page can bring its own', async () => {
	const screen = await render(Harness, { props: { withSubheader: false } });
	await expect.poll(() => slot('page-shell-content')).not.toBeNull();
	expect(slot('page-shell-subheader')).toBeNull();
	expect(slot('page-shell-header')!.nextElementSibling).toBe(slot('page-shell-content'));

	await screen.rerender({ page: true });
	await expect.poll(() => document.querySelector('[data-testid="page-tabs"]')).not.toBeNull();
	expect(
		slot('page-shell-subheader')!.contains(document.querySelector('[data-testid="page-tabs"]'))
	).toBe(true);

	await screen.rerender({ page: false });
	await expect.poll(() => slot('page-shell-subheader')).toBeNull();
});
