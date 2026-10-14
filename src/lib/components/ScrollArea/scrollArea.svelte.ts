import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { useBoundingClientRect } from '$lib/utils/useBoundingClientRect.svelte.js';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { useResizeObserver } from '$lib/utils/useResizeObserver.svelte.js';
import { untrack } from 'svelte';
import { on } from 'svelte/events';

/**
 * Slack allowed between scroll extent and client box before it counts as real overflow.
 * WCAG SCR34 wants a tab stop on genuinely scrollable regions only — a sub-pixel rounding
 * remainder is not one.
 */
const OVERFLOW_TOLERANCE = 1;

/** Shortest a thumb gets, in px, whatever the content length or an overscroll asks for. */
const MIN_THUMB_SIZE = 18;

/** How long after the last scroll event the area still counts as scrolling, in ms. */
const SCROLLING_IDLE_MS = 400;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/** `-0` becomes `0`, so a normalised RTL offset compares equal to zero. */
const unsigned = (value: number) => (value === 0 ? 0 : value);

/** How far a scroll offset sits beyond its range (rubber banding): negative before, positive after. */
const overscrollOf = (scroll: number, max: number) => scroll - clamp(scroll, 0, max);

export interface ScrollAreaOptions {
	delay: number;
	type: 'auto' | 'always' | 'scroll' | 'hover';
	scrollOnEdges: boolean;
	/**
	 * Px of content that may stay hidden past an edge before that edge counts as overflowing.
	 * Defaults to 1.
	 */
	overflowEdgeThreshold?: number;
	/**
	 * Writing direction of the viewport. In `rtl` the horizontal offset runs from 0 down to a
	 * negative number, so every horizontal read and write is mirrored. Defaults to `ltr`.
	 */
	direction?: () => 'ltr' | 'rtl';
}

export class ScrollArea extends createBindableStateClass<ScrollAreaOptions>() {
	viewportElement = $state<HTMLElement>();
	contentElement = $state<HTMLElement>();
	scrollbarXElement = $state<HTMLElement>();
	scrollbarYElement = $state<HTMLElement>();
	scrollY = $state(0);
	scrollX = $state(0);
	dragOffset = $state(0);
	// Force recalculation when resize happens
	viewportDimensions = $state<{ width: number; height: number }>({ width: 0, height: 0 });
	contentDimensions = $state<{ width: number; height: number }>({ width: 0, height: 0 });

	// Bumped by every measurement pass (ResizeObserver, MutationObserver, post-mount rAF). The
	// overflow deriveds read it so they re-run even when the observed box sizes happen to be
	// unchanged but the scroll extent moved (e.g. content replaced with equally-sized content).
	measureVersion = $state(0);

	// Measured from the viewport itself (the scroll container): with `overflow: scroll` its
	// scrollWidth/scrollHeight are always defined and reflect overflow. Live reads, re-evaluated
	// whenever the observed dimensions change — the ResizeObservers bump
	// `viewportDimensions`/`contentDimensions` (the display:table content wrapper makes horizontal
	// content changes observable), which invalidates these deriveds.
	maxScrollY = $derived.by(() => {
		if (!this.viewportElement) return 0;
		void this.viewportDimensions;
		void this.contentDimensions;
		void this.measureVersion;
		return Math.max(0, this.viewportElement.scrollHeight - this.viewportElement.clientHeight);
	});
	// 1px tolerance: sub-pixel layout (fractional line boxes, borders, zoom) routinely leaves a
	// 1px scroll extent that is not real overflow, and must not create a tab stop or a scrollbar.
	scrollbarYEnabled = $derived(this.maxScrollY > OVERFLOW_TOLERANCE);

	maxScrollX = $derived.by(() => {
		if (!this.viewportElement) return 0;
		void this.viewportDimensions;
		void this.contentDimensions;
		void this.measureVersion;
		return Math.max(0, this.viewportElement.scrollWidth - this.viewportElement.clientWidth);
	});
	scrollbarXEnabled = $derived(this.maxScrollX > OVERFLOW_TOLERANCE);

	visible = $derived(this.scrollbarYEnabled);
	visibleX = $derived(this.scrollbarXEnabled);

	// Whether the viewport lays out right-to-left. In RTL the browser's `scrollLeft` runs from 0
	// down to a negative number, so everything horizontal is read through `scrollX` (the distance
	// travelled from the inline start, never negative inside the range) and written back mirrored.
	rtl = $state(false);

	// Thickness in px of each rendered scrollbar track (0 while it is not rendered). Where both
	// bars show, each one stops short of the other so they do not overlap at the corner.
	trackYThickness = $state(0);
	trackXThickness = $state(0);

	// The threshold for the overflow-edge hooks: hidden content past an edge counts once it is
	// longer than this.
	private edgeThreshold = $derived(Math.max(0, this.overflowEdgeThreshold ?? OVERFLOW_TOLERANCE));

	// Scroll distance travelled from the start and left to travel to the end, per axis. These stay
	// inside the scroll range (an overscroll does not leave content "hidden") and are 0 while the
	// axis does not overflow.
	overflowYStart = $derived(this.scrollbarYEnabled ? clamp(this.scrollY, 0, this.maxScrollY) : 0);
	overflowYEnd = $derived(
		this.scrollbarYEnabled ? clamp(this.maxScrollY - this.scrollY, 0, this.maxScrollY) : 0
	);
	overflowXStart = $derived(this.scrollbarXEnabled ? clamp(this.scrollX, 0, this.maxScrollX) : 0);
	overflowXEnd = $derived(
		this.scrollbarXEnabled ? clamp(this.maxScrollX - this.scrollX, 0, this.maxScrollX) : 0
	);

	// Whether content is hidden past each edge, beyond the threshold.
	hasOverflowYStart = $derived(this.overflowYStart > this.edgeThreshold);
	hasOverflowYEnd = $derived(this.overflowYEnd > this.edgeThreshold);
	hasOverflowXStart = $derived(this.overflowXStart > this.edgeThreshold);
	hasOverflowXEnd = $derived(this.overflowXEnd > this.edgeThreshold);

	canScrollUp = $derived(this.hasOverflowYStart);
	canScrollDown = $derived(this.hasOverflowYEnd);

	thumbRect = useBoundingClientRect();
	trackRect = useBoundingClientRect();
	trackRectX = useBoundingClientRect();

	// Track lengths and thumb sizes read the live DOM, so they also depend on everything that
	// moves those numbers: the observed boxes, the scroll extent (`measureVersion`) and the track
	// boxes themselves (which also change when the other bar's corner inset appears). Without them
	// the thumb keeps the size it had when the content last crossed the overflow threshold.
	private trackYLength = $derived.by(() => {
		void this.viewportDimensions;
		void this.measureVersion;
		void this.trackRect.current;
		return this.scrollbarYElement?.clientHeight ?? 0;
	});
	private trackXLength = $derived.by(() => {
		void this.viewportDimensions;
		void this.measureVersion;
		void this.trackRectX.current;
		return this.scrollbarXElement?.clientWidth ?? 0;
	});

	/** Thumb length the content ratio asks for, before any overscroll shrinks it. */
	thumbYBaseSize = $derived.by(() => {
		void this.contentDimensions;
		if (
			!this.scrollbarYEnabled ||
			!this.scrollbarYElement ||
			!this.viewportElement ||
			!this.contentElement
		) {
			return 0;
		}
		const ratio = this.viewportElement.clientHeight / (this.viewportElement.scrollHeight || 1);
		return Math.max(ratio * this.trackYLength, MIN_THUMB_SIZE);
	});

	thumbXBaseSize = $derived.by(() => {
		void this.contentDimensions;
		if (
			!this.scrollbarXEnabled ||
			!this.scrollbarXElement ||
			!this.viewportElement ||
			!this.contentElement
		) {
			return 0;
		}
		const ratio = this.viewportElement.clientWidth / (this.viewportElement.scrollWidth || 1);
		return Math.max(ratio * this.trackXLength, MIN_THUMB_SIZE);
	});

	// WebKit lets the scroll offset leave its range while it rubber-bands. The thumb shrinks by
	// that amount and stays pinned to the edge that is being pulled, instead of leaving its track.
	overscrollY = $derived(overscrollOf(this.scrollY, this.maxScrollY));
	overscrollX = $derived(overscrollOf(this.scrollX, this.maxScrollX));

	thumbYSize = $derived(
		this.thumbYBaseSize === 0
			? 0
			: Math.max(this.thumbYBaseSize - Math.abs(this.overscrollY), MIN_THUMB_SIZE)
	);
	thumbXSize = $derived(
		this.thumbXBaseSize === 0
			? 0
			: Math.max(this.thumbXBaseSize - Math.abs(this.overscrollX), MIN_THUMB_SIZE)
	);

	// Scroll snapping would pull a dragged viewport to the nearest snap point under the thumb,
	// which then jumps between them. It is switched off while a thumb is held.
	private savedScrollSnapType: string | null = null;

	private pauseScrollSnap() {
		const viewport = this.viewportElement;
		if (!viewport || this.savedScrollSnapType !== null) return;
		this.savedScrollSnapType = viewport.style.scrollSnapType;
		viewport.style.scrollSnapType = 'none';
	}

	private restoreScrollSnap() {
		if (this.savedScrollSnapType === null) return;
		if (this.viewportElement) this.viewportElement.style.scrollSnapType = this.savedScrollSnapType;
		this.savedScrollSnapType = null;
	}

	isDraggingY = $state(false);
	// The thumb is a handle: the shared pointer drag captures the pointer on press (primary
	// button only), and a cancelled touch, a lost capture or a mouse released outside the window
	// ends the drag instead of leaving it stuck.
	dragY = createPointerDrag({
		onStart: ({ event, node }) => {
			// Offset from the pointer to the thumb top, from a fresh rect
			this.dragOffset = event.clientY - node.getBoundingClientRect().top;
			this.isDraggingY = true;
			this.pauseScrollSnap();
		},
		onMove: ({ y }) => {
			if (!this.scrollbarYElement) return;

			// Get fresh track rect at drag time
			const trackRect = this.scrollbarYElement.getBoundingClientRect();
			const maxThumbPos = Math.max(0, trackRect.height - this.thumbYBaseSize);

			// Calculate new thumb position relative to track
			let newThumbTop = y - this.dragOffset - trackRect.top;
			newThumbTop = Math.max(0, Math.min(newThumbTop, maxThumbPos));

			const scrollPercentage = maxThumbPos > 0 ? newThumbTop / maxThumbPos : 0;
			this.viewportElement!.scrollTop = scrollPercentage * this.maxScrollY;
		},
		onEnd: () => {
			this.isDraggingY = false;
			this.restoreScrollSnap();
		},
		onCancel: () => {
			this.isDraggingY = false;
			this.restoreScrollSnap();
		}
	});

	isDraggingX = $state(false);
	dragX = createPointerDrag({
		onStart: ({ event, node }) => {
			// Offset from the pointer to the thumb's inline start edge.
			const rect = node.getBoundingClientRect();
			this.dragOffset = this.rtl ? rect.right - event.clientX : event.clientX - rect.left;
			this.isDraggingX = true;
			this.pauseScrollSnap();
		},
		onMove: ({ x }) => {
			if (!this.scrollbarXElement) return;
			const trackRect = this.scrollbarXElement.getBoundingClientRect();
			const maxThumbPos = Math.max(0, trackRect.width - this.thumbXBaseSize);
			const pointer = this.rtl ? trackRect.right - x : x - trackRect.left;
			const newThumbStart = Math.max(0, Math.min(pointer - this.dragOffset, maxThumbPos));
			const scrollPercentage = maxThumbPos > 0 ? newThumbStart / maxThumbPos : 0;
			this.writeScrollX(scrollPercentage * this.maxScrollX);
		},
		onEnd: () => {
			this.isDraggingX = false;
			this.restoreScrollSnap();
		},
		onCancel: () => {
			this.isDraggingX = false;
			this.restoreScrollSnap();
		}
	});

	// The viewport is the focusable, named scroll region — but only when it actually overflows, so
	// an idle ScrollArea (e.g. a dropdown whose items fit) adds no phantom tab stop and no group to
	// the accessibility tree. Native `overflow: auto` then handles all keyboard scrolling (arrows,
	// PageUp/Down, Home/End, Space).
	overflowing = $derived(this.scrollbarYEnabled || this.scrollbarXEnabled);

	// Warning : non reactive.
	hoover = $derived(
		useHoverAction({
			delay: this.delay,
			isActive: () => this.type === 'hover'
		})
	);

	thumbYPosition = $derived.by(() => {
		if (this.maxScrollY <= 0 || !this.scrollbarYElement) return 0;
		const overscroll = this.overscrollY;
		if (overscroll < 0) return 0;
		if (overscroll > 0) return this.trackYLength - this.thumbYSize;
		return (this.scrollY / this.maxScrollY) * (this.trackYLength - this.thumbYSize);
	});

	/** Distance from the track's inline start to the thumb's inline start edge. */
	thumbXPosition = $derived.by(() => {
		if (this.maxScrollX <= 0 || !this.scrollbarXElement) return 0;
		const overscroll = this.overscrollX;
		if (overscroll < 0) return 0;
		if (overscroll > 0) return this.trackXLength - this.thumbXSize;
		return (this.scrollX / this.maxScrollX) * (this.trackXLength - this.thumbXSize);
	});

	/** The horizontal thumb's `translateX` in px: mirrored in RTL, where the track fills from the right. */
	thumbXTranslate = $derived(this.rtl ? -this.thumbXPosition : this.thumbXPosition);

	// Wheel / touch / trackpad / momentum scrolling is fully NATIVE via the viewport's
	// `overflow: auto` — no custom handlers needed. This class only reads the native scroll
	// offset (handleScroll) to position the custom thumbs, and drives programmatic scroll for
	// thumb-drag, track-click, keyboard, and edge auto-scroll.

	// True from the first scroll event until the viewport has been idle for a moment. The timer
	// handle is a plain field: only the boolean is state, so a scroll session writes it twice
	// instead of once per event.
	isScrolling = $state(false);
	private scrollingTimer: ReturnType<typeof setTimeout> | null = null;

	private clearScrollingTimer() {
		if (this.scrollingTimer === null) return;
		clearTimeout(this.scrollingTimer);
		this.scrollingTimer = null;
	}

	/** Horizontal scroll offset as distance from the inline start, whatever the direction. */
	private readScrollX(viewport: HTMLElement) {
		return unsigned(this.rtl ? -viewport.scrollLeft : viewport.scrollLeft);
	}

	/** Scrolls horizontally to a distance from the inline start. */
	private writeScrollX(value: number) {
		if (!this.viewportElement) return;
		this.viewportElement.scrollLeft = this.rtl ? -value : value;
	}

	private readScrollOffsets() {
		const viewport = this.viewportElement;
		if (!viewport) return;
		this.scrollY = viewport.scrollTop;
		this.scrollX = this.readScrollX(viewport);
	}

	private handleScroll = () => {
		if (!this.isScrolling) this.isScrolling = true;
		this.clearScrollingTimer();
		this.scrollingTimer = setTimeout(() => {
			this.scrollingTimer = null;
			this.isScrolling = false;
		}, SCROLLING_IDLE_MS);
		this.readScrollOffsets();
	};

	handleTrackClick = (event: MouseEvent) => {
		if (!this.viewportElement || !this.scrollbarYElement) return;

		// Don't handle clicks on the thumb itself
		if (event.composedPath().some((el) => el instanceof HTMLElement && el.dataset.thumb === ''))
			return;

		// Get click position relative to the track element
		const trackElement = this.scrollbarYElement;
		const trackRect = trackElement.getBoundingClientRect();
		const clickY = event.clientY - trackRect.top;

		// Calculate the maximum thumb position (track height minus thumb height)
		const maxThumbPos = Math.max(0, trackRect.height - this.thumbYBaseSize);

		// Center the thumb on the click position
		const targetThumbPos = clickY - this.thumbYBaseSize / 2;
		const clampedThumbPos = Math.max(0, Math.min(targetThumbPos, maxThumbPos));

		// Convert thumb position to scroll position
		const scrollPercentage = maxThumbPos > 0 ? clampedThumbPos / maxThumbPos : 0;
		this.viewportElement.scrollTop = scrollPercentage * this.maxScrollY;
	};

	handleTrackClickX = (event: MouseEvent) => {
		if (!this.viewportElement || !this.scrollbarXElement) return;
		if (event.composedPath().some((el) => el instanceof HTMLElement && el.dataset.thumb === ''))
			return;
		const trackRect = this.scrollbarXElement.getBoundingClientRect();
		const clickX = this.rtl ? trackRect.right - event.clientX : event.clientX - trackRect.left;
		const maxThumbPos = Math.max(0, trackRect.width - this.thumbXBaseSize);
		const targetThumbPos = clickX - this.thumbXBaseSize / 2;
		const clampedThumbPos = Math.max(0, Math.min(targetThumbPos, maxThumbPos));
		const scrollPercentage = maxThumbPos > 0 ? clampedThumbPos / maxThumbPos : 0;
		this.writeScrollX(scrollPercentage * this.maxScrollX);
	};

	// ---------------------------------------------------------------------------------------
	// Overflow measurement
	//
	// `overflowing` (the WCAG SCR34 tab stop) hangs off these numbers, so a stale measurement is an
	// accessibility bug, not a cosmetic one. Three things can make the first ResizeObserver
	// callback wrong: it can fire before the first layout has settled, the content can grow
	// afterwards without changing the observed border-boxes (an image resolving, a streamed
	// message, a lazily rendered child), and a `<slot>`ed subtree can swap wholesale. So we
	// measure from a ResizeObserver on BOTH boxes, a MutationObserver on the content subtree,
	// a `slotchange` listener, and a rAF right after mount.
	// ---------------------------------------------------------------------------------------

	private measureFrame: number | null = null;
	private lastExtentY = -1;
	private lastExtentX = -1;

	/**
	 * Read the live boxes and publish them. Idempotent: state is only written when a number
	 * actually moved, so a chatty MutationObserver cannot start a re-render loop.
	 */
	measure = () => {
		const viewport = this.viewportElement;
		if (!viewport) return;
		// The direction decides how the horizontal offset reads (negative in RTL), so it is
		// re-read with every measurement, and the offsets are published again when it flips.
		const rtl = this.direction?.() === 'rtl';
		if (rtl !== this.rtl) this.rtl = rtl;
		this.readScrollOffsets();
		const viewportWidth = viewport.clientWidth;
		const viewportHeight = viewport.clientHeight;
		if (
			viewportWidth !== this.viewportDimensions.width ||
			viewportHeight !== this.viewportDimensions.height
		) {
			this.viewportDimensions = { width: viewportWidth, height: viewportHeight };
		}
		const content = this.contentElement;
		const contentWidth = content ? content.scrollWidth : viewport.scrollWidth;
		const contentHeight = content ? content.scrollHeight : viewport.scrollHeight;
		if (
			contentWidth !== this.contentDimensions.width ||
			contentHeight !== this.contentDimensions.height
		) {
			this.contentDimensions = { width: contentWidth, height: contentHeight };
		}
		// The scroll extent is what `overflowing` and the scrollbars are derived from, and it
		// can change while both observed border-boxes stay identical. Bump only when it moves.
		const extentY = viewport.scrollHeight - viewportHeight;
		const extentX = viewport.scrollWidth - viewportWidth;
		if (extentY !== this.lastExtentY || extentX !== this.lastExtentX) {
			this.lastExtentY = extentY;
			this.lastExtentX = extentX;
			this.measureVersion++;
		}
	};

	/** Coalesce bursts of observer callbacks into one post-layout measurement. */
	private scheduleMeasure = () => {
		if (typeof requestAnimationFrame !== 'function') {
			this.measure();
			return;
		}
		if (this.measureFrame !== null) return;
		this.measureFrame = requestAnimationFrame(() => {
			this.measureFrame = null;
			this.measure();
		});
	};

	private cancelScheduledMeasure() {
		if (this.measureFrame !== null) {
			cancelAnimationFrame(this.measureFrame);
			this.measureFrame = null;
		}
	}

	viewportAttachment = (element: HTMLElement) => {
		this.viewportElement = element;
		untrack(() => {
			this.rtl = this.direction?.() === 'rtl';
			// A restored or pre-set scroll position is not announced by a scroll event.
			this.readScrollOffsets();
		});
		const offScroll = on(element, 'scroll', this.handleScroll);
		// Hide the native scrollbars cross-browser (WebKit handled via the component <style>).
		element.style.scrollbarWidth = 'none'; // Firefox + standard
		element.style.setProperty('-ms-overflow-style', 'none'); // old Edge/IE

		// Observe viewport resize; bumping the dimension state invalidates the live-read deriveds.
		const resizeObserver = useResizeObserver({
			isActive: () => true,
			callback: () => {
				this.viewportDimensions = { width: element.clientWidth, height: element.clientHeight };
				this.scheduleMeasure();
			}
		});
		const offResize = resizeObserver.reference?.(element);

		// The observer's first callback can land before layout has settled; re-read next frame.
		this.scheduleMeasure();

		return () => {
			offScroll();
			offResize?.();
			this.cancelScheduledMeasure();
			this.clearScrollingTimer();
			this.restoreScrollSnap();
		};
	};

	contentAttachment = (element: HTMLElement) => {
		this.contentElement = element;

		// Observe content resize (thumb sizing + overflow detection). With the content wrapper's
		// display:table, its border-box tracks the true content width, so this fires on horizontal
		// content changes too.
		const resizeObserver = useResizeObserver({
			isActive: () => true,
			callback: () => {
				this.contentDimensions = { width: element.scrollWidth, height: element.scrollHeight };
				this.scheduleMeasure();
			}
		});
		const offResize = resizeObserver.reference?.(element);

		// A ResizeObserver only reports the wrapper's own box. Children added/removed/retargeted
		// deeper in the tree can change the scroll extent without resizing that box, so watch the
		// subtree too and re-measure after the resulting layout.
		let mutationObserver: MutationObserver | null = null;
		if (typeof MutationObserver === 'function') {
			mutationObserver = new MutationObserver(this.scheduleMeasure);
			mutationObserver.observe(element, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}

		// Projected content (a <slot> in any custom element rendered inside) swaps without a
		// mutation on this subtree.
		const offSlotChange = on(element, 'slotchange', this.scheduleMeasure);

		this.scheduleMeasure();

		return () => {
			offResize?.();
			mutationObserver?.disconnect();
			offSlotChange();
			this.cancelScheduledMeasure();
		};
	};

	// Forward a wheel over the (overlaid) custom scrollbar to the viewport, so wheeling on the
	// thin bar scrolls the content just like wheeling on the viewport does. The wheel is only
	// consumed while the viewport can still move that way: at an edge it goes on to scroll the
	// page behind, as it does over the viewport itself.
	private forwardWheelToViewport = (event: WheelEvent) => {
		const viewport = this.viewportElement;
		if (!viewport) return;
		const canScrollY =
			event.deltaY > 0
				? viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop >= OVERFLOW_TOLERANCE
				: event.deltaY < 0 && viewport.scrollTop >= OVERFLOW_TOLERANCE;
		// Along the inline axis: a positive delta scrolls towards the inline end.
		const towardsEnd = (this.rtl ? -event.deltaX : event.deltaX) > 0;
		const towardsStart = (this.rtl ? -event.deltaX : event.deltaX) < 0;
		const scrollX = this.readScrollX(viewport);
		const maxScrollX = viewport.scrollWidth - viewport.clientWidth;
		const canScrollX =
			(towardsEnd && maxScrollX - scrollX >= OVERFLOW_TOLERANCE) ||
			(towardsStart && scrollX >= OVERFLOW_TOLERANCE);
		if (!canScrollY && !canScrollX) return;
		viewport.scrollTop += event.deltaY;
		viewport.scrollLeft += event.deltaX;
		event.preventDefault();
	};

	// A press on a scrollbar or its thumb must not pull focus away from the control that has it
	// (a Combobox input whose list is being dragged, say): the default action of the press, which
	// moves focus and starts a text selection, is cancelled. Touch is left alone, where it would
	// only stop the scroll gesture.
	private keepFocusOnPress = (event: MouseEvent) => {
		if (event.button === 0) event.preventDefault();
	};

	trackAttachment = (element: HTMLElement) => {
		this.trackYThickness = element.offsetWidth;
		const offClick = on(element, 'click', this.handleTrackClick);
		const offWheel = on(element, 'wheel', this.forwardWheelToViewport, { passive: false });
		const offPointerDown = on(element, 'pointerdown', (event) => {
			if (event.pointerType !== 'touch') this.keepFocusOnPress(event);
		});
		const offMouseDown = on(element, 'mousedown', this.keepFocusOnPress);
		return () => {
			offClick();
			offWheel();
			offPointerDown();
			offMouseDown();
			this.trackYThickness = 0;
		};
	};

	trackAttachmentX = (element: HTMLElement) => {
		this.trackXThickness = element.offsetHeight;
		const offClick = on(element, 'click', this.handleTrackClickX);
		const offWheel = on(element, 'wheel', this.forwardWheelToViewport, { passive: false });
		const offPointerDown = on(element, 'pointerdown', (event) => {
			if (event.pointerType !== 'touch') this.keepFocusOnPress(event);
		});
		const offMouseDown = on(element, 'mousedown', this.keepFocusOnPress);
		return () => {
			offClick();
			offWheel();
			offPointerDown();
			offMouseDown();
			this.trackXThickness = 0;
		};
	};

	private scrollAnimationFrame = $state<number | null>(null);
	private edgeScrollSpeed = $state(0);

	get scrollOnEdgesAttachment() {
		if (!this.scrollOnEdges) return null;
		return (element: HTMLElement) => {
			const edgeThreshold = 10; // pixels from edge to trigger scroll
			const maxScrollSpeed = 3; // pixels per frame

			const handlePointerMove = (event: PointerEvent) => {
				if (!this.viewportElement || !this.scrollbarYEnabled) {
					this.stopEdgeScroll();
					return;
				}

				const rect = element.getBoundingClientRect();
				const pointerY = event.clientY - rect.top;
				const elementHeight = rect.height;

				// Check if pointer is near top edge
				if (pointerY < edgeThreshold && pointerY >= 0) {
					const intensity = 1 - pointerY / edgeThreshold;
					this.edgeScrollSpeed = -maxScrollSpeed * intensity;
					this.startEdgeScroll();
				}
				// Check if pointer is near bottom edge
				else if (pointerY > elementHeight - edgeThreshold && pointerY <= elementHeight) {
					const distanceFromBottom = elementHeight - pointerY;
					const intensity = 1 - distanceFromBottom / edgeThreshold;
					this.edgeScrollSpeed = maxScrollSpeed * intensity;
					this.startEdgeScroll();
				}
				// Not near any edge
				else {
					this.stopEdgeScroll();
				}
			};

			const handlePointerLeave = () => {
				this.stopEdgeScroll();
			};

			const offMove = on(element, 'pointermove', handlePointerMove);
			const offLeave = on(element, 'pointerleave', handlePointerLeave);

			return () => {
				this.stopEdgeScroll();
				offMove();
				offLeave();
			};
		};
	}

	private startEdgeScroll() {
		if (this.scrollAnimationFrame !== null) return;

		const scroll = () => {
			if (!this.viewportElement || this.edgeScrollSpeed === 0) {
				this.stopEdgeScroll();
				return;
			}

			const newScrollTop = this.viewportElement.scrollTop + this.edgeScrollSpeed;
			const clampedScrollTop = Math.max(0, Math.min(newScrollTop, this.maxScrollY));

			// Stop if we've reached the limit
			if (
				(this.edgeScrollSpeed < 0 && clampedScrollTop === 0) ||
				(this.edgeScrollSpeed > 0 && clampedScrollTop === this.maxScrollY)
			) {
				this.stopEdgeScroll();
				return;
			}

			this.viewportElement.scrollTop = clampedScrollTop;
			this.scrollAnimationFrame = requestAnimationFrame(scroll);
		};

		this.scrollAnimationFrame = requestAnimationFrame(scroll);
	}

	private stopEdgeScroll() {
		if (this.scrollAnimationFrame !== null) {
			cancelAnimationFrame(this.scrollAnimationFrame);
			this.scrollAnimationFrame = null;
		}
		this.edgeScrollSpeed = 0;
	}
}
