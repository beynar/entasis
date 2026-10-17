// Kanban auto-scroll in real engines (Chromium and WebKit): a drag resting near a side of a board
// that overflows horizontally scrolls the board, standalone and inside a Tabs panel. The scroller
// only runs when the auto-scroll monitor shares the element adapter that owns the drag.
import { describe, expect, test } from 'vitest';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import KanbanAutoScrollHarness from './KanbanAutoScrollHarness.test.svelte';

const mount = async (inTabs: boolean) => {
	render(ThemeProviderHarness, {
		props: {
			component: KanbanAutoScrollHarness as unknown as Component<Record<string, unknown>>,
			inTabs
		}
	});
	await nextFrame();
	await nextFrame();
	return document.querySelector<HTMLElement>('[data-kanban]')!;
};

const frames = async (count: number) => {
	for (let index = 0; index < count; index += 1) await nextFrame();
};

const fire = (type: string, target: Element, x: number, y: number, dataTransfer: DataTransfer) =>
	target.dispatchEvent(
		new DragEvent(type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			clientX: x,
			clientY: y,
			dataTransfer
		})
	);

// Synthetic native drag events: the element adapter starts from `dragstart` and tracks the
// pointer from `dragover`, exactly as it does for a trusted gesture. The gesture starts over
// `grip` (a drag handle checks the point under the pointer) on its draggable ancestor.
const startDrag = async (grip: HTMLElement) => {
	const source = grip.closest<HTMLElement>('[draggable="true"]')!;
	const dataTransfer = new DataTransfer();
	const rect = grip.getBoundingClientRect();
	const x = rect.left + 20;
	const y = rect.top + rect.height / 2;
	grip.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, isPrimary: true })
	);
	fire('dragstart', source, x, y, dataTransfer);
	await frames(2);
	return {
		hover: async (hoverX: number, hoverY: number, count = 30) => {
			for (let index = 0; index < count; index += 1) {
				const target = document.elementFromPoint(hoverX, hoverY) ?? document.body;
				fire('dragenter', target, hoverX, hoverY, dataTransfer);
				fire('dragover', target, hoverX, hoverY, dataTransfer);
				await nextFrame();
			}
		},
		end: async () => {
			fire('dragend', source, x, y, dataTransfer);
			await frames(2);
		}
	};
};

const sources = {
	card: (board: HTMLElement) =>
		board.querySelector<HTMLElement>('[data-dnd-list] [data-dnd-list] [draggable="true"]')!,
	column: (board: HTMLElement) => board.querySelector<HTMLElement>('[data-dnd-handle]')!
};

describe.each([
	['standalone', false],
	['inside Tabs', true]
])('Kanban auto-scroll %s', (_label, inTabs) => {
	test.each(['card', 'column'] as const)(
		'a %s drag near the sides scrolls the board',
		async (kind) => {
			const board = await mount(inTabs);
			expect(board.scrollWidth).toBeGreaterThan(board.clientWidth);
			expect(board.scrollLeft).toBe(0);

			const drag = await startDrag(sources[kind](board));
			const rect = board.getBoundingClientRect();
			const y = rect.top + 24;

			await drag.hover(rect.right - 8, y);
			const afterRight = board.scrollLeft;
			expect(afterRight).toBeGreaterThan(0);

			await drag.hover(rect.left + 8, y);
			expect(board.scrollLeft).toBeLessThan(afterRight);

			await drag.end();
		}
	);
});
