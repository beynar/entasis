/** Distance kept between an item-aligned panel and the viewport edges, in px. */
export const SELECT_ALIGN_MARGIN = 8;

/**
 * Viewport measurements of an open Select, taken with the option list at its natural height and
 * scrolled to the top. `textStart` values are the inline-start edge of the text (left in LTR,
 * right in RTL).
 */
export type SelectAlignMetrics = {
	viewport: { width: number; height: number };
	trigger: { top: number; height: number };
	/** The trigger's value (or placeholder) text. */
	valueTextStart: number;
	panel: { left: number; right: number; top: number; width: number; height: number };
	/** The scrolling option list inside the panel. */
	list: { top: number; height: number };
	/** The option to put on the trigger: the selected one, else the first. */
	item: { top: number; height: number; textStart: number };
	rtl: boolean;
};

export type SelectAlignment = {
	/** Panel position, viewport coordinates. */
	x: number;
	y: number;
	/** Height to cap the option list at. */
	listHeight: number;
	/** Scroll offset that keeps the option on the trigger. */
	scrollTop: number;
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Item-aligned placement, the native select's and Radix's: the panel covers the trigger with the
 * option's middle on the trigger's middle and its text on the value text. A panel that would cross
 * the top edge is pinned there and its list scrolled by the overflow, so the option stays on the
 * trigger; one that would cross the bottom edge is cut short and scrolls. Only when the trigger
 * sits so low that fewer than four rows would fit does the panel rise and give up the alignment.
 */
export function alignItemWithTrigger(m: SelectAlignMetrics): SelectAlignment {
	const top = SELECT_ALIGN_MARGIN;
	const bottom = m.viewport.height - SELECT_ALIGN_MARGIN;
	const chromeAbove = m.list.top - m.panel.top;
	const chromeBelow = m.panel.top + m.panel.height - (m.list.top + m.list.height);
	const itemMiddle = m.item.top + m.item.height / 2 - m.panel.top;
	const triggerMiddle = m.trigger.top + m.trigger.height / 2;

	let y = triggerMiddle - itemMiddle;
	let scrollTop = 0;
	if (y < top) {
		scrollTop = top - y;
		y = top;
	}
	let height = Math.min(m.panel.height - scrollTop, bottom - y);
	const minHeight = Math.min(m.panel.height, chromeAbove + chromeBelow + m.item.height * 4);
	if (height < minHeight) {
		height = minHeight;
		y = Math.max(top, bottom - height);
	}
	const listHeight = Math.max(0, height - chromeAbove - chromeBelow);
	scrollTop = clamp(scrollTop, 0, m.list.height - listHeight);

	// Line the option's text up with the value's: the panel moves by the gap between them.
	const textOffset = m.rtl ? m.panel.right - m.item.textStart : m.item.textStart - m.panel.left;
	const x = m.rtl ? m.valueTextStart + textOffset - m.panel.width : m.valueTextStart - textOffset;

	return {
		x: clamp(x, SELECT_ALIGN_MARGIN, m.viewport.width - SELECT_ALIGN_MARGIN - m.panel.width),
		y,
		listHeight,
		scrollTop
	};
}
