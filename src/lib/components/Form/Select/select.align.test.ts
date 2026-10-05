import { describe, expect, test } from 'vitest';
import {
	alignItemWithTrigger,
	SELECT_ALIGN_MARGIN,
	type SelectAlignMetrics
} from './select.align.js';

// A 200px-wide panel with 4px of chrome above and below a list of 32px rows. The trigger is
// 32px tall with its value text 16px in from its left edge; option text sits 12px into the panel.
const ROW = 32;
const metrics = ({
	rows = 5,
	index = 2,
	triggerTop = 300,
	triggerLeft = 100,
	viewport = { width: 1000, height: 600 },
	rtl = false
}: Partial<{
	rows: number;
	index: number;
	triggerTop: number;
	triggerLeft: number;
	viewport: { width: number; height: number };
	rtl: boolean;
}> = {}): SelectAlignMetrics => ({
	viewport,
	trigger: { top: triggerTop, height: ROW },
	valueTextStart: rtl ? triggerLeft + 200 - 16 : triggerLeft + 16,
	panel: { left: 0, right: 200, top: 0, width: 200, height: 4 + rows * ROW + 4 },
	list: { top: 4, height: rows * ROW },
	item: { top: 4 + index * ROW, height: ROW, textStart: rtl ? 200 - 12 : 12 },
	rtl
});

// Where the option's middle lands once the panel is placed and its list scrolled.
const itemMiddleOnScreen = (
	m: SelectAlignMetrics,
	placed: ReturnType<typeof alignItemWithTrigger>
) => placed.y + (m.item.top - m.panel.top) - placed.scrollTop + m.item.height / 2;
const triggerMiddle = (m: SelectAlignMetrics) => m.trigger.top + m.trigger.height / 2;

describe('alignItemWithTrigger', () => {
	test('a short list opens whole, the option on the trigger and its text on the value', () => {
		const m = metrics();
		const placed = alignItemWithTrigger(m);
		expect(itemMiddleOnScreen(m, placed)).toBe(triggerMiddle(m));
		expect(placed.scrollTop).toBe(0);
		expect(placed.listHeight).toBe(5 * ROW);
		// Option text (12px into the panel) on the value text (116px): the panel starts at 104.
		expect(placed.x).toBe(104);
	});

	test('a list crossing the top edge is pinned there and scrolled, the option still on the trigger', () => {
		const m = metrics({ rows: 50, index: 30, triggerTop: 120 });
		const placed = alignItemWithTrigger(m);
		expect(placed.y).toBe(SELECT_ALIGN_MARGIN);
		expect(placed.scrollTop).toBeGreaterThan(0);
		expect(itemMiddleOnScreen(m, placed)).toBe(triggerMiddle(m));
		// The panel fits the viewport.
		expect(placed.y + 4 + placed.listHeight + 4).toBeLessThanOrEqual(600 - SELECT_ALIGN_MARGIN);
	});

	test('a list crossing the bottom edge is cut short and scrolls, the option still on the trigger', () => {
		const m = metrics({ rows: 50, index: 1, triggerTop: 300 });
		const placed = alignItemWithTrigger(m);
		expect(itemMiddleOnScreen(m, placed)).toBe(triggerMiddle(m));
		expect(placed.y + 4 + placed.listHeight + 4).toBe(600 - SELECT_ALIGN_MARGIN);
	});

	test('a trigger too low for four rows below gives up the alignment and rises into view', () => {
		const m = metrics({ rows: 10, index: 0, triggerTop: 570 });
		const placed = alignItemWithTrigger(m);
		expect(placed.y + 4 + placed.listHeight + 4).toBeLessThanOrEqual(600 - SELECT_ALIGN_MARGIN);
		expect(placed.listHeight).toBeGreaterThanOrEqual(4 * ROW);
		expect(itemMiddleOnScreen(m, placed)).toBeLessThan(triggerMiddle(m));
	});

	test('a short list pinned at the top grows down to four rows instead of dropping to the bottom', () => {
		// The last of five options under a trigger near the top: aligning it would need the panel to
		// start above the viewport, and the scroll that pinning takes leaves under two rows.
		const m = metrics({ rows: 5, index: 4, triggerTop: 30 });
		const placed = alignItemWithTrigger(m);
		expect(placed.y).toBe(SELECT_ALIGN_MARGIN);
		expect(placed.listHeight).toBe(4 * ROW);
		// Scrolled as far as the list goes, which keeps the option as close to the trigger as it gets.
		expect(placed.scrollTop).toBe(ROW);
		const middle = itemMiddleOnScreen(m, placed);
		expect(middle).toBeGreaterThan(placed.y);
		expect(middle).toBeLessThan(placed.y + 4 + placed.listHeight);
	});

	test('a list only its own padding taller than four rows opens whole instead of scrolling a few px', () => {
		// Four options in a list with 4px of padding, the last selected, the trigger near the top.
		const padding = 4;
		const m: SelectAlignMetrics = {
			viewport: { width: 1000, height: 600 },
			trigger: { top: 30, height: ROW },
			valueTextStart: 116,
			panel: { left: 0, right: 200, top: 0, width: 200, height: 4 + 4 * ROW + 2 * padding + 4 },
			list: { top: 4, height: 4 * ROW + 2 * padding },
			item: { top: 4 + padding + 3 * ROW, height: ROW, textStart: 12 },
			rtl: false
		};
		const placed = alignItemWithTrigger(m);
		expect(placed.listHeight).toBe(m.list.height);
		expect(placed.scrollTop).toBe(0);
	});

	test('in RTL the text lines up on the right edges', () => {
		const m = metrics({ rtl: true });
		const placed = alignItemWithTrigger(m);
		// Value text ends at 284; option text ends 12px inside the panel's right edge.
		expect(placed.x + 200 - 12).toBe(284);
	});

	test('the panel never leaves the viewport sideways', () => {
		expect(alignItemWithTrigger(metrics({ triggerLeft: -50 })).x).toBe(SELECT_ALIGN_MARGIN);
		expect(alignItemWithTrigger(metrics({ triggerLeft: 950 })).x).toBe(
			1000 - SELECT_ALIGN_MARGIN - 200
		);
	});
});
