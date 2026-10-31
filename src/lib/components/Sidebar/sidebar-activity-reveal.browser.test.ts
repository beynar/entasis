// A hidden offcanvas sidebar beside an activity bar, revealed from the edge in a real browser: the
// panel slides out from under the bar, never across it, for every variant, and the bar stays on
// top while the revealed panel is open.
import { beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import type { SidebarVariant } from './sidebar.props.js';
import SidebarRevealHarness from './SidebarRevealHarness.test.svelte';

const variants: SidebarVariant[] = ['admin', 'inset', 'floating', 'split', 'framed'];

const activityBar = () =>
	document.querySelector<HTMLElement>('[data-slot="sidebar-activity-bar-container"]')!;
const edgeTrigger = () =>
	document.querySelector<HTMLElement>('[data-slot="sidebar-edge-trigger"]')!;

/**
 * The topmost elements across the activity bar's column, its gutters included, sampled on every
 * frame for `duration` ms.
 */
const sampleBarColumn = async (duration: number) => {
	const box = activityBar().getBoundingClientRect();
	const points = [0.05, 0.5, 0.95].flatMap((fx) =>
		[0.005, 0.25, 0.5, 0.995].map((fy) => [box.left + box.width * fx, box.top + box.height * fy])
	);
	const hits: (Element | null)[] = [];
	const start = performance.now();
	while (performance.now() - start < duration) {
		for (const [x, y] of points) hits.push(document.elementFromPoint(x!, y!));
		await new Promise(requestAnimationFrame);
	}
	return hits;
};

beforeEach(async () => {
	await page.viewport(1280, 720);
	await userEvent.hover(document.documentElement, {
		position: { x: window.innerWidth - 2, y: window.innerHeight - 2 }
	});
});

describe('edge reveal beside an activity bar', () => {
	for (const variant of variants) {
		test(`a ${variant} panel slides out from under the bar, never across it`, async () => {
			render(SidebarRevealHarness, { variant });
			await animationsSettled();

			const sampling = sampleBarColumn(600);
			await userEvent.hover(edgeTrigger());
			const hits = await sampling;

			await expect
				.poll(() => document.querySelector('[data-slot="sidebar-container"]')?.className)
				.toContain('z-40');
			const panel = document.querySelector('[data-slot="sidebar-container"]')!;
			const strays = hits.filter((hit) => hit && panel.contains(hit));
			expect(strays.map((hit) => hit?.closest('[data-slot]')?.getAttribute('data-slot'))).toEqual(
				[]
			);
		});
	}
});
