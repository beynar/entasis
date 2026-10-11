import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ScrollAreaHarness from './ScrollAreaHarness.test.svelte';

const viewport = () =>
	screen.getByText('Long article').closest<HTMLElement>('[data-scroll-area-viewport]')!;

// jsdom has no layout: every box reports 0, so a scroll area never overflows unless the scroll
// extent is faked. Overflow is measured as scrollHeight - clientHeight (0 in jsdom).
const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')!;
const overflow = () =>
	Object.defineProperty(Element.prototype, 'scrollHeight', {
		configurable: true,
		get: () => 400
	});
afterEach(() => {
	Object.defineProperty(Element.prototype, 'scrollHeight', scrollHeight);
});

describe('ScrollArea accessibility tree', () => {
	test('a11y:scroll-area.accessibility-tree leaves a viewport that fits its content as a plain element', () => {
		render(ScrollAreaHarness);

		expect(viewport()).not.toHaveAttribute('role');
		expect(viewport()).not.toHaveAttribute('aria-label');
		expect(viewport()).not.toHaveAttribute('tabindex');
		expect(screen.queryByRole('group')).toBeNull();
	});

	test('names an overflowing viewport as a focusable group', async () => {
		overflow();
		render(ScrollAreaHarness);

		await waitFor(() => expect(viewport()).toHaveAttribute('tabindex', '0'));
		expect(viewport()).toHaveAttribute('role', 'group');
		expect(screen.getByRole('group', { name: 'Scrollable content' })).toBe(viewport());
	});

	test('a focused viewport keeps its focus when its content stops overflowing', async () => {
		let extent = 400;
		Object.defineProperty(Element.prototype, 'scrollHeight', {
			configurable: true,
			get: () => extent
		});
		render(ScrollAreaHarness);
		const region = viewport();
		await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
		region.focus();
		expect(document.activeElement).toBe(region);

		// The content now fits (a resize, a zoom-out, filtered content). Dropping the tabindex of
		// the focused element would send focus to <body> in a real browser, so it stays -1, and the
		// viewport keeps the role and name it is focused with.
		extent = 0;
		region.querySelector('p')!.append(' (edited)');
		await waitFor(() => expect(region).toHaveAttribute('tabindex', '-1'));
		expect(document.activeElement).toBe(region);
		expect(screen.getByRole('group', { name: 'Scrollable content' })).toBe(region);

		// Once focus moves on, the idle viewport is a plain element again.
		region.blur();
		await waitFor(() => expect(region).not.toHaveAttribute('tabindex'));
		expect(region).not.toHaveAttribute('role');
		expect(region).not.toHaveAttribute('aria-label');
	});

	test('keeps an explicit label as a named group even when the content fits', () => {
		render(ScrollAreaHarness, { props: { label: 'Release notes' } });

		expect(screen.getByRole('group', { name: 'Release notes' })).toBe(viewport());
		expect(viewport()).not.toHaveAttribute('tabindex');
	});

	test('keeps an explicit viewport role without inventing a name when the content fits', () => {
		render(ScrollAreaHarness, { props: { viewportRole: 'rowgroup' } });

		expect(viewport()).toHaveAttribute('role', 'rowgroup');
		expect(viewport()).not.toHaveAttribute('aria-label');
	});

	test('keeps a presentational viewport unnamed and out of the tab order while it overflows', async () => {
		overflow();
		render(ScrollAreaHarness, { props: { viewportRole: 'presentation', type: 'always' } });

		// The scrollbar only renders once the overflow is measured.
		await waitFor(() =>
			expect(document.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull()
		);
		expect(viewport()).toHaveAttribute('role', 'presentation');
		expect(viewport()).not.toHaveAttribute('aria-label');
		expect(viewport()).not.toHaveAttribute('tabindex');
	});

	test('hides the pointer-only scrollbars and edge arrows from assistive tech', async () => {
		overflow();
		render(ScrollAreaHarness, { props: { type: 'always', scrollOnEdges: true } });

		await waitFor(() =>
			expect(document.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull()
		);
		const scrollbar = document.querySelector('[data-slot="scroll-area-scrollbar"]')!;
		expect(scrollbar).toHaveAttribute('aria-hidden', 'true');
		expect(scrollbar).not.toHaveAttribute('role');
		expect(scrollbar).not.toHaveAttribute('aria-valuenow');
		expect(screen.queryByRole('scrollbar')).toBeNull();
		// The edge arrow that says "more below" is decorative.
		const svg = document.querySelector('[data-scroll-area] > div[aria-hidden="true"] svg');
		expect(svg).not.toBeNull();
	});
});
