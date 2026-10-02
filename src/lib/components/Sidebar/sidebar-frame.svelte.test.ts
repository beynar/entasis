// An inset or split page drops its frame (padding, rounding, AppShell's border and shadow) to fill
// the edge only when nothing of the sidebar stays beside it. A hidden panel with an activity bar
// still has the rail on screen, so the page keeps its framed form.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import SidebarFrameHarness from './SidebarFrameHarness.test.svelte';

const wrapper = () => document.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]')!;
const main = () => document.querySelector<HTMLElement>('[data-slot="sidebar-main"]')!;

describe('sidebar page frame', () => {
	for (const variant of ['inset', 'split'] as const) {
		test(`${variant}: a hidden panel without an activity bar lets the page fill the edge`, () => {
			render(SidebarFrameHarness, {
				props: { variant, displayState: 'hidden', withActivityBar: false }
			});
			expect(wrapper()).toHaveAttribute('data-page-flush', 'true');
			expect(main()).toHaveClass('md:p-0', 'md:rounded-none');
		});

		test(`${variant}: a hidden panel with an activity bar keeps the page framed`, () => {
			render(SidebarFrameHarness, {
				props: { variant, displayState: 'hidden', withActivityBar: true }
			});
			expect(wrapper()).not.toHaveAttribute('data-page-flush');
			expect(main()).not.toHaveClass('md:p-0');
			expect(main()).toHaveClass('md:py-md', 'md:[--page-shell-edge-inset:0.5rem]');
		});
	}

	test('split: next to the activity bar, the hidden panel hands its gutter to the page', () => {
		render(SidebarFrameHarness, {
			props: { variant: 'split', displayState: 'hidden', withActivityBar: true }
		});
		expect(main()).toHaveClass('md:pl-md');
	});
});
