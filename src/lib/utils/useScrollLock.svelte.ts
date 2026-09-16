// Refcounted scroll lock: the first lock on a scroller stores its original inline
// overflow/padding and the last release restores them, so stacked overlays can each
// hold a lock without clobbering one another.
type ScrollLockOptions = {
	isActive: () => boolean;
	scroller?: HTMLElement;
};

// WeakMap (not Map): purely imperative refcount bookkeeping keyed by element, read and
// written from inside effects — a reactive Map here would re-trigger its own effect.
const locks = new WeakMap<HTMLElement, { count: number; overflow: string; paddingRight: string }>();

/** Locks `scroller` (default `document.body`) and returns a release function. */
export const lockScroll = (scroller: HTMLElement = document.body) => {
	const entry = locks.get(scroller);
	if (entry) {
		entry.count += 1;
	} else {
		const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
		locks.set(scroller, {
			count: 1,
			overflow: scroller.style.overflow,
			paddingRight: scroller.style.paddingRight
		});
		if (scrollBarWidth > 0) scroller.style.paddingRight = `${scrollBarWidth}px`;
		scroller.style.overflow = 'hidden';
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		const current = locks.get(scroller);
		if (!current) return;
		current.count -= 1;
		if (current.count > 0) return;
		scroller.style.overflow = current.overflow;
		scroller.style.paddingRight = current.paddingRight;
		locks.delete(scroller);
	};
};

export const useScrollLock = (opts: ScrollLockOptions) => {
	$effect(() => {
		if (!opts.isActive()) return;
		return lockScroll(opts.scroller);
	});
};
