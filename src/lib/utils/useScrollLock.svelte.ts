// Refcounted scroll lock. A lock is an attribute on the scroller (`<html>` by default) and one
// rule in the Tailwind plugin CSS (`[data-entasis-scroll-lock]`, see `tailwind/global.ts`) that
// sets `overflow: hidden`. Nothing is read back from or written to the element's inline styles,
// so a lock another library holds on the same element (a third-party modal that sets inline
// `overflow: hidden`) is neither restored over nor released early: releasing ours removes only our
// attribute, and the page stays locked for as long as anyone else's lock holds.
type ScrollLockOptions = {
	isActive: () => boolean;
	scroller?: HTMLElement;
};

/** The attribute a locked scroller carries. */
export const SCROLL_LOCK_ATTRIBUTE = 'data-entasis-scroll-lock';
/**
 * Value of `data-entasis-scroll-lock` when there is nothing to compensate: the page already
 * reserves its scrollbar gutter (`scrollbar-gutter: stable`) or shows no classic scrollbar.
 * Otherwise the value is empty and the plugin rule keeps the scrollbar's room.
 */
export const SCROLL_LOCK_UNCOMPENSATED = 'uncompensated';
/**
 * Value of `data-entasis-scroll-lock` when `scrollbar-gutter: stable` did not keep the hidden
 * scrollbar's room (the property is unsupported, or the scroller has a custom scrollbar): the
 * plugin rule pads the scroller by the scrollbar's width instead.
 */
export const SCROLL_LOCK_PADDED = 'padding';
/**
 * Custom property set on a locked scroller: the width in px of the scrollbar the lock hides,
 * `0px` with overlay scrollbars. Use it to keep `position: fixed` bars from jumping sideways.
 */
export const SCROLLBAR_WIDTH_VARIABLE = '--entasis-scrollbar-width';

// WeakMap (not Map): purely imperative refcount bookkeeping keyed by element, read and
// written from inside effects — a reactive Map here would re-trigger its own effect.
const locks = new WeakMap<HTMLElement, { count: number }>();

/** Whether `scrollbar-gutter: stable` already keeps room for the scrollbar on `scroller`. */
const reservesGutter = (scroller: HTMLElement) => {
	const document = scroller.ownerDocument;
	// The root element's value (or the body's, when its overflow propagates) styles the viewport.
	const targets = scroller === document.documentElement ? [scroller, document.body] : [scroller];
	return targets.some((target) =>
		document.defaultView?.getComputedStyle(target).scrollbarGutter?.startsWith('stable')
	);
};

/** The width of the scrollbar `scroller` shows now, `0` when it has none or an overlay one. */
const measureScrollbarWidth = (scroller: HTMLElement) => {
	const document = scroller.ownerDocument;
	if (scroller === document.documentElement) {
		return Math.max(0, (document.defaultView?.innerWidth ?? 0) - scroller.clientWidth);
	}
	return Math.max(0, scroller.offsetWidth - scroller.clientWidth);
};

/** Locks `scroller` (default the page, `<html>`) and returns a release function. */
export const lockScroll = (scroller: HTMLElement = document.documentElement) => {
	const entry = locks.get(scroller);
	if (entry) {
		entry.count += 1;
	} else {
		locks.set(scroller, { count: 1 });
		// Measured before the attribute hides the scrollbar.
		const width = measureScrollbarWidth(scroller);
		const before = scroller.clientWidth;
		scroller.style.setProperty(SCROLLBAR_WIDTH_VARIABLE, `${width}px`);
		if (width === 0 || reservesGutter(scroller)) {
			scroller.setAttribute(SCROLL_LOCK_ATTRIBUTE, SCROLL_LOCK_UNCOMPENSATED);
		} else {
			scroller.setAttribute(SCROLL_LOCK_ATTRIBUTE, '');
			// `scrollbar-gutter` is not honoured everywhere (older engines, custom scrollbars on the
			// viewport). When the content still widened into the hidden scrollbar's room, pad it back.
			if (scroller.clientWidth - before >= width / 2) {
				scroller.setAttribute(SCROLL_LOCK_ATTRIBUTE, SCROLL_LOCK_PADDED);
			}
		}
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		const current = locks.get(scroller);
		if (!current) return;
		current.count -= 1;
		if (current.count > 0) return;
		scroller.removeAttribute(SCROLL_LOCK_ATTRIBUTE);
		scroller.style.removeProperty(SCROLLBAR_WIDTH_VARIABLE);
		locks.delete(scroller);
	};
};

export const useScrollLock = (opts: ScrollLockOptions) => {
	$effect(() => {
		if (!opts.isActive()) return;
		return lockScroll(opts.scroller);
	});
};
