import { onDestroy, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';

/**
 * A minimal, framework-agnostic pan/zoom controller for a single DOM or SVG
 * root. It applies a CSS `translate3d + scale` transform to the attached node,
 * listens on the node's parent (the "owner" viewport) for drag / wheel / pinch,
 * and exposes imperative zoom/fit controls.
 *
 * Ported from svelte-streamdown's panzoom utility and adapted to the svelai
 * conventions (attachment returns a cleanup, `untrack` around setup, options via
 * getters so reactive flags stay live).
 */
export interface PanzoomOptions {
	/** Minimum zoom scale. @default 0.1 */
	minZoom?: number;
	/** Maximum zoom scale. @default +Infinity */
	maxZoom?: number;
	/** Wheel sensitivity. @default 1 */
	zoomSpeed?: number;
	/** Zoom multiplier applied on double-click. @default 1.75 */
	doubleClickScale?: number;
	/** Initial scale / translate. */
	initialScale?: number;
	initialX?: number;
	initialY?: number;
	/**
	 * When false, wheel events are ignored (the page scrolls normally). Pass a
	 * getter so the flag can react to hover gating.
	 */
	activateMouseWheel?: boolean;
	/**
	 * Capture single-finger touch as a pan. Off by default so an inline diagram never
	 * traps the page scroll; turn it on inside a dialog or any other surface that owns
	 * the viewport. Pinch-zoom always works. Getter-friendly like `activateMouseWheel`.
	 */
	touchPan?: boolean;
}

export const usePanzoom = (opts: PanzoomOptions = {}) => {
	// transform state
	let x = opts.initialX ?? 0;
	let y = opts.initialY ?? 0;
	let scale = opts.initialScale ?? 1;

	const minZoom = opts.minZoom ?? 0.1;
	const maxZoom = opts.maxZoom ?? Number.POSITIVE_INFINITY;
	const zoomSpeed = opts.zoomSpeed ?? 1;
	const doubleClickScale = opts.doubleClickScale ?? 1.75;

	let node: HTMLElement | SVGSVGElement | null = null;
	let eventTarget: HTMLElement | null = null;
	const listeners = new SvelteSet<() => void>();

	// drag state
	let dragging = false;
	let lastClientX = 0;
	let lastClientY = 0;
	let dragOffMove: (() => void) | null = null;
	let dragOffUp: (() => void) | null = null;

	// touch state
	let touchMode: 'none' | 'pan' | 'pinch' = 'none';
	let pinchDistance = 0;

	const destroy = () => {
		listeners.forEach((off) => off());
		listeners.clear();
		if (dragOffMove) dragOffMove();
		if (dragOffUp) dragOffUp();
	};

	onDestroy(destroy);

	const clampScale = (s: number) => Math.min(Math.max(s, minZoom), maxZoom);

	const apply = () => {
		if (!node) return;
		scale = clampScale(scale);
		const r = (v: number) => Math.round(v * 1000) / 1000;
		x = r(x);
		y = r(y);
		scale = r(scale);
		const el = node as HTMLElement;
		el.style.transformOrigin = '0 0';
		el.style.willChange = 'transform';
		el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
	};

	const zoomAt = (clientX: number, clientY: number, factor: number) => {
		if (!node || !Number.isFinite(factor) || factor === 1) return;
		const nextScale = clampScale(scale * factor);
		const ratio = nextScale / scale;
		if (ratio === 1) return;
		const owner = (eventTarget ?? node.parentElement ?? (node as HTMLElement)) as HTMLElement;
		const ownerRect = owner.getBoundingClientRect();
		const ox = clientX - ownerRect.left;
		const oy = clientY - ownerRect.top;
		// Keep (ox, oy) stationary in owner space while scaling.
		x = ratio * x + (1 - ratio) * ox;
		y = ratio * y + (1 - ratio) * oy;
		scale = nextScale;
		apply();
	};

	const kineticWheel = (deltaY: number) => {
		const sign = Math.sign(deltaY);
		const step = Math.min(0.25, Math.abs((zoomSpeed * deltaY) / 128));
		return 1 - sign * step;
	};

	const onWheel = (e: WheelEvent) => {
		if (!opts.activateMouseWheel || !node) return;
		e.preventDefault();
		e.stopPropagation();
		zoomAt(e.clientX, e.clientY, kineticWheel(e.deltaY * (e.deltaMode ? 100 : 1)));
	};

	const isInteractive = (el: Element) => {
		const tag = el.tagName.toLowerCase();
		return (
			el.closest('[data-panzoom-ignore]') !== null ||
			['button', 'a', 'input', 'textarea', 'select', 'label', 'summary', 'details'].includes(tag) ||
			(el as HTMLElement).isContentEditable
		);
	};

	const onDblClick = (e: MouseEvent) => {
		const t = e.target as Element | null;
		if (node && t && !(t === (node as Element) || (node as Element).contains(t))) return;
		if (t && isInteractive(t)) return;
		e.preventDefault();
		const baseEl = (eventTarget ?? node?.parentElement ?? (node as HTMLElement)) as HTMLElement;
		const base = baseEl.getBoundingClientRect();
		zoomAt(base.left + base.width / 2, base.top + base.height / 2, doubleClickScale);
	};

	const startDrag = (e: MouseEvent) => {
		if (e.button !== 0) return;
		const t = e.target as Element | null;
		// Don't start a pan from a control (buttons carry data-panzoom-ignore).
		if (t && t.closest('[data-panzoom-ignore]')) return;
		dragging = true;
		lastClientX = e.clientX;
		lastClientY = e.clientY;
		e.preventDefault();
		if (node) (node as HTMLElement).style.cursor = 'grabbing';
		dragOffMove = () => window.removeEventListener('mousemove', onDragMove);
		dragOffUp = () => window.removeEventListener('mouseup', endDrag);
		window.addEventListener('mousemove', onDragMove, { passive: false });
		window.addEventListener('mouseup', endDrag, { passive: true });
		listeners.add(dragOffMove);
		listeners.add(dragOffUp);
	};

	const onDragMove = (e: MouseEvent) => {
		if (!dragging) return;
		x += e.clientX - lastClientX;
		y += e.clientY - lastClientY;
		lastClientX = e.clientX;
		lastClientY = e.clientY;
		apply();
	};

	const endDrag = () => {
		dragging = false;
		if (node) (node as HTMLElement).style.cursor = 'grab';
		if (dragOffMove) {
			dragOffMove();
			listeners.delete(dragOffMove);
		}
		if (dragOffUp) {
			dragOffUp();
			listeners.delete(dragOffUp);
		}
		dragOffMove = dragOffUp = null;
	};

	const onTouchStart = (e: TouchEvent) => {
		if (!node) return;
		const t0 = e.target as Element | null;
		if (t0 && t0.closest('[data-panzoom-ignore]')) return;
		if (e.touches.length === 1) {
			// A single finger falls through to native page scroll unless the caller owns
			// the viewport; pinch-zoom still needs two fingers.
			if (!opts.touchPan) return;
			touchMode = 'pan';
			lastClientX = e.touches[0].clientX;
			lastClientY = e.touches[0].clientY;
		} else if (e.touches.length >= 2) {
			touchMode = 'pinch';
			const [t1, t2] = [e.touches[0], e.touches[1]];
			pinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
		}
		e.preventDefault();
		const offMove = () => window.removeEventListener('touchmove', onTouchMove);
		const offEnd = () => window.removeEventListener('touchend', onTouchEnd);
		const offCancel = () => window.removeEventListener('touchcancel', onTouchEnd);
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', onTouchEnd, { passive: true });
		window.addEventListener('touchcancel', onTouchEnd, { passive: true });
		listeners.add(offMove);
		listeners.add(offEnd);
		listeners.add(offCancel);
	};

	const onTouchMove = (e: TouchEvent) => {
		if (!node) return;
		if (touchMode === 'pan' && e.touches.length === 1) {
			const t = e.touches[0];
			x += t.clientX - lastClientX;
			y += t.clientY - lastClientY;
			lastClientX = t.clientX;
			lastClientY = t.clientY;
			apply();
			e.preventDefault();
		} else if (touchMode === 'pinch' && e.touches.length >= 2) {
			const [t1, t2] = [e.touches[0], e.touches[1]];
			const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
			const factor = dist / (pinchDistance || dist);
			zoomAt((t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2, factor);
			pinchDistance = dist;
			e.preventDefault();
		}
	};

	const onTouchEnd = () => {
		touchMode = 'none';
		pinchDistance = 0;
	};

	const attach = (target: HTMLElement | SVGSVGElement) => {
		return untrack(() => {
			node = target;
			const isSVG = typeof SVGSVGElement !== 'undefined' && target instanceof SVGSVGElement;
			eventTarget = (target.parentElement as HTMLElement | null) ?? (target as HTMLElement);
			apply();

			const add = <E extends Event>(
				type: string,
				handler: (e: E) => void,
				options?: AddEventListenerOptions
			) => {
				const n = (eventTarget ?? (node as HTMLElement)) as HTMLElement;
				n.addEventListener(type, handler as EventListener, options);
				const off = () => n.removeEventListener(type, handler as EventListener, options);
				listeners.add(off);
			};

			add('mousedown', startDrag, { passive: false });
			add('wheel', onWheel, { passive: false, capture: true });
			add('dblclick', onDblClick, { passive: false });
			add('touchstart', onTouchStart, { passive: false });

			const surface = (eventTarget ?? node) as HTMLElement;
			surface.style.userSelect = 'none';
			// Native scroll stays intact unless the caller captures single-finger panning.
			surface.style.touchAction = opts.touchPan ? 'none' : '';
			surface.style.cursor = 'grab';
			surface.style.overscrollBehavior = 'contain';
			if (isSVG) (node.style as CSSStyleDeclaration).transformBox = 'fill-box';

			return () => destroy();
		});
	};

	const zoomToFit = (padding = 0.05) => {
		if (!node) return;
		const parent = node.parentElement;
		if (!parent) return;
		const parentRect = parent.getBoundingClientRect();
		const rect = node.getBoundingClientRect();
		const naturalWidth = rect.width / scale || 0;
		const naturalHeight = rect.height / scale || 0;
		const targetWidth = parentRect.width * (1 - 2 * padding);
		const targetHeight = parentRect.height * (1 - 2 * padding);
		if (naturalWidth <= 0 || naturalHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) return;
		scale = clampScale(Math.min(targetWidth / naturalWidth, targetHeight / naturalHeight));
		x = 0;
		y = 0;
		apply();
		// Re-measure at the new scale, then centre within the parent.
		const newRect = node.getBoundingClientRect();
		x = parentRect.left + (parentRect.width - newRect.width) / 2 - newRect.left;
		y = parentRect.top + (parentRect.height - newRect.height) / 2 - newRect.top;
		apply();
	};

	const zoomBy = (factor: number) => {
		if (!node) return;
		const owner = (eventTarget ?? node.parentElement ?? (node as HTMLElement)) as HTMLElement;
		const ownerRect = owner.getBoundingClientRect();
		zoomAt(ownerRect.left + ownerRect.width / 2, ownerRect.top + ownerRect.height / 2, factor);
	};

	const zoomIn = (factor = 1.25) => zoomBy(factor);
	const zoomOut = (factor = 1.25) => {
		if (factor > 0) zoomBy(1 / factor);
	};

	return {
		attach,
		zoomToFit,
		zoomIn,
		zoomOut,
		zoomBy,
		get transform() {
			return { x, y, scale } as const;
		}
	};
};
