// Floating placement for Popover panels: the floating-ui middleware chain, the coordinates and
// CSS variables written on the portaled wrapper, logical sides, the motion that starts from the
// side facing the reference, and the autoUpdate wiring. PopoverState owns the reactive state (open
// state, the panel's minimum width, its transform origin and resolved side) and hands the
// positioner getters for its inputs and callbacks for its outputs. The getters are read when a
// placement runs; the synchronous part of the mount placement runs inside the panel attachment,
// so the inputs it reads re-place a mounted panel when they change.
import {
	arrow as arrowMiddleware,
	autoUpdate,
	computePosition,
	flip,
	hide,
	inline,
	offset,
	platform,
	shift,
	size,
	type Alignment,
	type ClientRectObject,
	type Placement,
	type Side,
	type Strategy,
	type VirtualElement
} from '@floating-ui/dom';
import type { PopupAlign, PopupSide } from '$lib/utils/stateAttributes.js';
import type {
	PopoverAnchorTo,
	PopoverCollisionBoundary,
	PopoverFallbackAxisSide,
	PopoverPlacement,
	PopoverProps,
	PopoverSide
} from './popover.props.js';

/** What a floating panel is placed against: the trigger, the `ref` element, or a virtual point. */
export type PopoverReference = HTMLElement | VirtualElement;

/** Reading direction a placement resolves logical sides and start/end alignment with. */
export type PanelDirection = 'ltr' | 'rtl';

/** Gap in px between the reference and the panel when `offset` is unset. */
const DEFAULT_OFFSET = 4;
/** Space in px that `flip`, `shift` and `size` keep between the panel and the viewport edges. */
const VIEWPORT_PADDING = 20;
/** Distance in px a directed transition travels along the placement axis. */
const DIRECTED_DISTANCE = 10;
/**
 * How long the visual viewport has to stay still before the panel is placed once more. iOS
 * reports intermediate sizes while the on-screen keyboard slides in and the final one only after
 * its last `resize` event.
 */
export const VIEWPORT_SETTLE_MS = 100;

/**
 * CSS variables a placement writes on the wrapper, inherited by the panel and its content:
 * the room left between the panel and the viewport edges, the reference's size snapped to the
 * device pixel grid, and the point the panel scales from.
 */
export const PANEL_CSS_VARIABLES = [
	'--available-width',
	'--available-height',
	'--anchor-width',
	'--anchor-height',
	'--transform-origin'
] as const;

/** Rounds a CSS pixel length to the device pixel grid, so edges stay crisp on every screen. */
export const snapToDevicePixel = (value: number, ratio = 1) => {
	const scale = ratio > 0 ? ratio : 1;
	return Math.round(value * scale) / scale;
};

/** The device pixel ratio of the window an element lives in. */
const devicePixelRatioOf = (element: Element) =>
	element.ownerDocument.defaultView?.devicePixelRatio || 1;

const isLogical = (placement: PopoverPlacement) => placement.startsWith('inline-');

/**
 * The floating-ui placement for a requested one: `inline-start` / `inline-end` become `left` /
 * `right` in a left-to-right document and `right` / `left` in a right-to-left one, keeping their
 * alignment. Physical placements pass through (floating-ui mirrors their `start` / `end`
 * alignment on its own).
 */
export const resolvePlacement = (placement: PopoverPlacement, direction: PanelDirection) => {
	if (!isLogical(placement)) return placement as Placement;
	const [, edge, align] = placement.split('-') as ['inline', 'start' | 'end', Alignment?];
	const side: Side = (edge === 'start') === (direction === 'ltr') ? 'left' : 'right';
	return (align ? `${side}-${align}` : side) as Placement;
};

/** The popovers reporting a side on each anchor element, in the order they last reported. */
const anchorAttributeClaims = new WeakMap<HTMLElement, Map<string, Map<object, string>>>();

/**
 * Sets an attribute on an anchor for one owner: the anchor shows the value of the owner that
 * claimed it last, and loses the attribute only when no owner claims it. Several popovers (a menu
 * and its tooltip) can share one trigger; one closing must not strip the others' hook.
 * Pass `null` to withdraw the owner's claim.
 */
export const claimAnchorAttribute = (
	anchor: HTMLElement,
	owner: object,
	name: string,
	value: string | null
) => {
	let byName = anchorAttributeClaims.get(anchor);
	let claims = byName?.get(name);
	if (value === null) {
		claims?.delete(owner);
	} else {
		if (!byName) anchorAttributeClaims.set(anchor, (byName = new Map()));
		if (!claims) byName.set(name, (claims = new Map()));
		claims.delete(owner);
		claims.set(owner, value);
	}
	const current = claims && [...claims.values()].at(-1);
	if (current !== undefined) anchor.setAttribute(name, current);
	else anchor.removeAttribute(name);
};

/** `data-popup-side` on an anchor for one owner; see `claimAnchorAttribute`. */
export const claimPopupSide = (anchor: HTMLElement, owner: object, side: string | null) =>
	claimAnchorAttribute(anchor, owner, 'data-popup-side', side);

/** `data-popup-open` on an anchor for one owner while its popup is open; see `claimAnchorAttribute`. */
export const claimPopupOpen = (anchor: HTMLElement, owner: object, open: boolean) =>
	claimAnchorAttribute(anchor, owner, 'data-popup-open', open ? '' : null);

/**
 * The side a placed panel reports: the physical side floating-ui resolved, or, when a logical
 * side was requested and the panel stayed on the inline axis, the logical side it landed on (a
 * flip from `inline-end` reports `inline-start`).
 */
export const reportedSide = (
	resolved: Placement,
	requested: PopoverPlacement,
	direction: PanelDirection
): PopupSide => {
	const side = resolved.split('-')[0] as Side;
	if (!isLogical(requested) || side === 'top' || side === 'bottom') return side;
	return (side === 'right') === (direction === 'ltr') ? 'inline-end' : 'inline-start';
};

/** `start`, `center` or `end` from a resolved placement. */
export const placementAlign = (placement: Placement): PopupAlign =>
	(placement.split('-')[1] as Alignment | undefined) ?? 'center';

/**
 * The CSS `transform-origin` for a resolved placement: the panel edge facing the reference, at
 * the corner its alignment lines up with. floating-ui aligns a vertical `-start` placement to the
 * reference's right edge in a right-to-left document, so `start` is the right corner there.
 */
export const transformOriginFor = (placement: Placement, direction: PanelDirection) => {
	const side = placement.split('-')[0] as Side;
	const align = placementAlign(placement);
	if (side === 'top' || side === 'bottom') {
		const x =
			align === 'center'
				? 'center'
				: (align === 'start') === (direction === 'ltr')
					? 'left'
					: 'right';
		return `${x} ${side === 'top' ? 'bottom' : 'top'}`;
	}
	const y = align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center';
	return `${side === 'left' ? 'right' : 'left'} ${y}`;
};

/**
 * Whether floating-ui's `hide()` result can be trusted for this reference. A bare virtual point
 * (a context menu at the cursor) has no scroll container to leave, and a reference with no size
 * reads as clipped whenever it touches a viewport edge.
 */
const canReportHidden = (reference: PopoverReference, rect: { width: number; height: number }) =>
	(reference instanceof Element || !!reference.contextElement) &&
	(rect.width > 0 || rect.height > 0);

/** What one placement asks floating-ui for, besides the reference and the panel. */
export interface PanelMiddlewareOptions {
	/** Gap in px between the reference and the panel; `undefined` keeps the 4px default. */
	offset?: number;
	/** The viewport `shift` keeps the panel inside. */
	collisionBoundary?: PopoverCollisionBoundary;
	/** The perpendicular sides `flip` falls back to when neither side of the axis fits. */
	fallbackAxisSide?: PopoverFallbackAxisSide;
	/**
	 * The requested placement. With `fallbackAxisSide` and a left or right side it narrows the
	 * fallback to the one perpendicular side asked for; see `fallbackPlacementsFor`.
	 */
	placement?: Placement;
	/**
	 * Anchor to the line of a wrapped reference nearest this point (viewport coordinates);
	 * `null` lets floating-ui's `inline()` pick the first or last line from the side. Omitted
	 * anchors to the whole box.
	 */
	line?: { x: number; y: number } | null;
	/** The arrow element the panel draws toward its reference; omitted for a panel without one. */
	arrow?: HTMLElement | null;
}

/** Room in px the arrow keeps from the panel's corners, so it never sits on a rounded corner. */
const ARROW_PADDING = 10;

/** The line box of a wrapped reference nearest a point: the one holding it, else the closest. */
export const nearestLine = <Rect extends ClientRectObject>(
	rects: Iterable<Rect>,
	point: { x: number; y: number }
): Rect | null => {
	let nearest: Rect | null = null;
	let nearestDistance = Infinity;
	for (const rect of rects) {
		if (!rect.width && !rect.height) continue;
		const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
		const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
		const distance = dx * dx + dy * dy;
		if (distance < nearestDistance) {
			nearest = rect;
			nearestDistance = distance;
		}
	}
	return nearest;
};

/**
 * A reference standing for the line of `reference` nearest the point. floating-ui's own
 * `inline()` honours a point only for two disjoint lines; a wrapped link usually has overlapping
 * ones, so the line is chosen here and placed like any other box. The line is read at placement
 * time, so a scroll or resize follows it.
 */
const lineReference = (
	reference: PopoverReference,
	point: { x: number; y: number }
): VirtualElement => ({
	contextElement: reference instanceof Element ? reference : reference.contextElement,
	getBoundingClientRect: () =>
		nearestLine(reference.getClientRects?.() ?? [], point) ?? reference.getBoundingClientRect()
});

const OPPOSITE_SIDE: Record<Side, Side> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left'
};
const OPPOSITE_ALIGNMENT = { start: 'end', end: 'start' } as const;

/**
 * The placements `flip` tries after the requested one when it asks for a perpendicular fallback
 * beside a left or right placement (a submenu). floating-ui's own `fallbackAxisSideDirection`
 * lists both perpendicular sides, and `flip` takes the first that fits: a submenu with no room
 * below its row would jump above it and cover its menu. Only the requested side is kept, so with
 * no room anywhere the least-overflowing candidate wins and `shift` slides it back. `undefined`
 * leaves floating-ui's defaults.
 */
export const fallbackPlacementsFor = (
	placement: Placement | undefined,
	fallbackAxisSide: PopoverFallbackAxisSide
): Placement[] | undefined => {
	if (!placement || fallbackAxisSide === 'none') return undefined;
	const [side, align] = placement.split('-') as [Side, Alignment | undefined];
	if (side !== 'left' && side !== 'right') return undefined;
	const alignments = align ? [align, OPPOSITE_ALIGNMENT[align]] : [undefined];
	const withAlign = (target: Side, alignment: Alignment | undefined) =>
		(alignment ? `${target}-${alignment}` : target) as Placement;
	const cross: Side = fallbackAxisSide === 'end' ? 'bottom' : 'top';
	return [
		// What flip tries without the option: the opposite side, then the alignment mirrors.
		...(align ? [withAlign(side, OPPOSITE_ALIGNMENT[align])] : []),
		...alignments.map((alignment) => withAlign(OPPOSITE_SIDE[side], alignment)),
		...alignments.map((alignment) => withAlign(cross, alignment))
	];
};

/**
 * The floating-ui middleware every floating panel is placed with, in order: `inline` (only when
 * anchoring to a line without a pointer point), `offset`, `flip`, `size`, `shift`, `arrow` (only
 * with an arrow element) and `hide`. `size` writes the available
 * space and the snapped reference size as CSS variables on the wrapper. It runs before `shift`,
 * so `--available-height` is the room on the panel's own side of the reference: a list capped by
 * it never has to slide over its trigger to fit.
 */
export const panelMiddleware = ({
	offset: gap,
	collisionBoundary = 'visualViewport',
	fallbackAxisSide = 'none',
	placement,
	line,
	arrow
}: PanelMiddlewareOptions = {}) => [
	...(line === null ? [inline({})] : []),
	offset(gap ?? DEFAULT_OFFSET),
	flip({
		mainAxis: true,
		crossAxis: true,
		padding: VIEWPORT_PADDING,
		fallbackAxisSideDirection: fallbackAxisSide,
		fallbackPlacements: fallbackPlacementsFor(placement, fallbackAxisSide)
	}),
	size({
		padding: VIEWPORT_PADDING,
		apply({ elements, rects, availableWidth, availableHeight }) {
			const wrapper = elements.floating;
			const ratio = devicePixelRatioOf(wrapper);
			const style = wrapper.style;
			style.setProperty('--available-width', `${Math.max(0, availableWidth)}px`);
			style.setProperty('--available-height', `${Math.max(0, availableHeight)}px`);
			style.setProperty('--anchor-width', `${snapToDevicePixel(rects.reference.width, ratio)}px`);
			style.setProperty('--anchor-height', `${snapToDevicePixel(rects.reference.height, ratio)}px`);
		}
	}),
	shift({
		mainAxis: true,
		crossAxis: true,
		padding: VIEWPORT_PADDING,
		// floating-ui's `viewport` is the visual viewport; the layout viewport ignores
		// pinch-zoom, so panning a zoomed page doesn't drag the panel along.
		rootBoundary: collisionBoundary === 'layoutViewport' ? 'layoutViewport' : 'viewport'
	}),
	// After `shift`, so the arrow follows the panel to where it finally sits.
	...(arrow ? [arrowMiddleware({ element: arrow, padding: ARROW_PADDING })] : []),
	hide()
];

/** Everything `computePanelPosition` needs besides the reference and the panel. */
export interface PanelPositionOptions extends PanelMiddlewareOptions {
	placement: Placement;
	/** The direction floating-ui mirrors `start` / `end` alignment with. */
	direction?: PanelDirection;
}

/** Asks floating-ui where the panel goes: viewport-fixed coordinates and the placement after flipping. */
export const computePanelPosition = (
	reference: PopoverReference,
	panel: HTMLElement,
	{ placement, direction, ...middleware }: PanelPositionOptions
) =>
	computePosition(middleware.line ? lineReference(reference, middleware.line) : reference, panel, {
		strategy: 'fixed',
		placement,
		middleware: panelMiddleware({ ...middleware, placement }),
		// The direction resolved for the reference, not the portaled wrapper's own: a trigger in
		// a `dir="rtl"` subtree aligns like the subtree even though its panel sits under <body>.
		...(direction ? { platform: { ...platform, isRTL: () => direction === 'rtl' } } : {})
	});

/**
 * Puts the wrapper at viewport coordinates, rounded to the device pixel grid, and reveals it: a
 * floating panel stays hidden until its first placement lands, so it never flashes at the
 * top-left corner. `anchorHidden` keeps it hidden while its anchor is scrolled out of view.
 * `right` and `bottom` are reset because a `<dialog>` keeps the browser's `inset-inline: 0`,
 * which beats `left` in a right-to-left document.
 */
export const writePanelPosition = (
	panel: HTMLElement,
	x: number,
	y: number,
	strategy: Strategy = 'fixed',
	{ anchorHidden = false }: { anchorHidden?: boolean } = {}
) => {
	const ratio = devicePixelRatioOf(panel);
	Object.assign(panel.style, {
		position: strategy,
		left: `${snapToDevicePixel(x, ratio)}px`,
		top: `${snapToDevicePixel(y, ratio)}px`,
		right: 'auto',
		bottom: 'auto',
		visibility: anchorHidden ? 'hidden' : ''
	});
};

const ARROW_STATIC_SIDE: Record<Side, Side> = {
	top: 'bottom',
	right: 'left',
	bottom: 'top',
	left: 'right'
};

/** What floating-ui's `arrow` middleware reports. */
export type ArrowData = { x?: number; y?: number; centerOffset: number };

/**
 * Places the arrow on the edge of the panel that faces the reference, along the cross axis where
 * `arrow` put it, and records the physical side as `data-side`. `data-uncentered` marks an arrow
 * pushed off the middle of the panel by a shift. The edge offset is half the arrow's own size:
 * a rotated square then pokes out by half its diagonal's overhang.
 */
export const writeArrowPosition = (
	arrow: HTMLElement,
	placement: Placement,
	data: ArrowData | undefined
) => {
	const side = placement.split('-')[0] as Side;
	const edge = ARROW_STATIC_SIDE[side];
	const half = (arrow.offsetWidth || 0) / 2;
	Object.assign(arrow.style, {
		left: data?.x != null ? `${data.x}px` : '',
		top: data?.y != null ? `${data.y}px` : '',
		right: '',
		bottom: '',
		[edge]: `${-half}px`
	});
	arrow.setAttribute('data-side', side);
	if (data && data.centerOffset !== 0) arrow.setAttribute('data-uncentered', '');
	else arrow.removeAttribute('data-uncentered');
};

/**
 * Hands the wrapper back to the document's layout (an inline panel, a mobile sheet). `reveal`
 * also clears the visibility a floating panel is hidden with until placed.
 */
export const releasePanelPosition = (panel: HTMLElement, reveal: boolean) => {
	Object.assign(
		panel.style,
		reveal
			? { position: '', left: '', top: '', right: '', bottom: '', visibility: '' }
			: { position: '', left: '', top: '', right: '', bottom: '' }
	);
	for (const name of PANEL_CSS_VARIABLES) panel.style.removeProperty(name);
};

/** How a directed transition moves the panel in from the reference. */
export interface DirectedMotion {
	/** CSS `transform-origin` for the animated panel. */
	transformOrigin: string;
	/** The axis the panel travels along. */
	axis: 'x' | 'y';
	/** The signed fly distance in px, written to the `in` and `out` params on `axis`. */
	distance: number;
}

/**
 * The directed transition for a resolved placement: the panel travels along the placement axis
 * and scales from the edge facing the reference, at the corner its alignment lines up with.
 */
export const directedMotion = (
	placement: Placement,
	direction: PanelDirection = 'ltr'
): DirectedMotion => {
	const side = placement.split('-')[0] as Side;
	return {
		transformOrigin: transformOriginFor(placement, direction),
		axis: side === 'top' || side === 'bottom' ? 'y' : 'x',
		distance: side === 'top' || side === 'left' ? DIRECTED_DISTANCE : -DIRECTED_DISTANCE
	};
};

/** The fly offsets a transition had before a directed motion first wrote to it. */
const undirectedOffsets = new WeakMap<object, { x?: unknown; y?: unknown }>();

/**
 * Writes a directed motion's fly distance into transition params. The other axis gets back the
 * value it had before any directed motion, so a panel that opened on another axis earlier
 * doesn't slide in diagonally.
 */
export const applyDirectedOffset = (
	params: { x?: number | `${number}%`; y?: number | `${number}%` },
	{ axis, distance }: Pick<DirectedMotion, 'axis' | 'distance'>
) => {
	let base = undirectedOffsets.get(params);
	if (!base) {
		base = { x: params.x, y: params.y };
		undirectedOffsets.set(params, base);
	}
	Object.assign(params, base, { [axis]: distance });
};

/** One written placement, reported to the owner. */
export interface PanelPlacement {
	/** The positioned wrapper. */
	panel: HTMLElement;
	/** The placement floating-ui resolved after flipping; `null` when `positionPanel` placed the panel. */
	placement: Placement | null;
	/** The side the panel sits on, logical when a logical side was requested; `none` for `positionPanel`. */
	side: PopoverSide;
	/** The panel's alignment with the reference; `null` for `positionPanel`. */
	align: PopupAlign | null;
	/** Whether the reference is scrolled out of view, which keeps the panel hidden. */
	anchorHidden: boolean;
	/** The direction the placement was resolved with. */
	direction: PanelDirection;
	/** Whether this is the placement made as the panel mounted. */
	mount: boolean;
}

/** What the positioner reads from its owner and reports back to it. */
export interface PanelPositionerOptions {
	/** The reference the panel is placed against, or `null` while there is none. */
	reference: () => PopoverReference | null;
	/** Whether floating-ui places the panel: inline panels and mobile sheets follow the document. */
	floating: () => boolean;
	/** Whether the opening transition has ended. Until it has, only the mount placement runs. */
	settled: () => boolean;
	/** The preferred placement, resolved from responsive values; logical sides allowed. */
	placement: () => PopoverPlacement;
	/** The reading direction logical sides and alignment resolve with. Default `'ltr'`. */
	direction?: () => PanelDirection;
	/** Gap in px between the reference and the panel; `undefined` uses the default. */
	offset: () => number | undefined;
	/** Whether the panel is at least as wide as the reference. */
	fitTrigger: () => boolean;
	/** The consumer's own placement, tried before floating-ui. */
	positionPanel: () => PopoverProps['positionPanel'];
	/** The viewport `shift` keeps the panel inside. Default `'visualViewport'`. */
	collisionBoundary?: () => PopoverCollisionBoundary | undefined;
	/** The perpendicular sides `flip` falls back to. Default `'none'`. */
	fallbackAxisSide?: () => PopoverFallbackAxisSide | undefined;
	/** Whether the panel anchors to the reference's box or to one of its lines. Default `'box'`. */
	anchorTo?: () => PopoverAnchorTo | undefined;
	/** The point (viewport coordinates) that picks the line when anchoring to a line. */
	anchorPoint?: () => { x: number; y: number } | null;
	/** The arrow element inside the panel, or `null` for a panel without one. */
	arrow?: () => HTMLElement | null;
	/**
	 * Receives the panel's minimum width in px: the reference width snapped to the device pixel
	 * grid (`fitTrigger`), the `minWidth` returned by `positionPanel`, or `null` when the panel is
	 * not floating.
	 */
	setMinWidth: (width: number | null) => void;
	/** Runs after each write of the panel's coordinates. */
	onPlace: (placed: PanelPlacement) => void;
}

export interface PanelPositioner {
	/**
	 * Places a floating panel once. Outside the mount placement it waits for the opening
	 * transition to end; for a panel that is not floating it only clears the minimum width.
	 */
	place: (panel: HTMLElement, mount?: boolean) => Promise<void>;
	/**
	 * Hides the panel, places it, and re-places it on every change floating-ui observes (scroll,
	 * resize, either element's size, the visual viewport) and once more when the visual viewport
	 * has settled after a change (an on-screen keyboard, pinch-zoom). `onReferenceDetached` runs
	 * instead of a placement once an element reference has left the document. Returns the cleanup.
	 */
	track: (
		panel: HTMLElement,
		reference: PopoverReference,
		onReferenceDetached: () => void
	) => () => void;
}

/**
 * Writes the reference's size, snapped to the device pixel grid, before floating-ui runs; returns
 * the box and its snapped width.
 */
const writeAnchorSize = (panel: HTMLElement, reference: PopoverReference) => {
	const ratio = devicePixelRatioOf(panel);
	const rect = reference.getBoundingClientRect();
	const width = snapToDevicePixel(rect.width, ratio);
	panel.style.setProperty('--anchor-width', `${width}px`);
	panel.style.setProperty('--anchor-height', `${snapToDevicePixel(rect.height, ratio)}px`);
	return { rect, width };
};

export const createPanelPositioner = (options: PanelPositionerOptions): PanelPositioner => {
	const place = async (panel: HTMLElement, mount = false) => {
		const reference = options.floating() ? options.reference() : null;
		if (!reference) {
			options.setMinWidth(null);
			return;
		}
		if (!mount && !options.settled()) {
			return;
		}
		const direction = options.direction?.() ?? 'ltr';
		const anchor = writeAnchorSize(panel, reference);
		if (options.fitTrigger()) {
			options.setMinWidth(anchor.width);
		}

		const custom = options.positionPanel()?.({ panel, reference });
		if (custom) {
			if (custom.minWidth != null) options.setMinWidth(custom.minWidth);
			writePanelPosition(panel, custom.x, custom.y);
			panel.style.removeProperty('--transform-origin');
			options.onPlace({
				panel,
				placement: null,
				side: 'none',
				align: null,
				anchorHidden: false,
				direction,
				mount
			});
			return;
		}

		const requested = options.placement();
		const lineAnchor =
			options.anchorTo?.() === 'line' && typeof reference.getClientRects === 'function';
		const arrow = options.arrow?.() ?? null;
		const { x, y, strategy, placement, middlewareData } = await computePanelPosition(
			reference,
			panel,
			{
				placement: resolvePlacement(requested, direction),
				direction,
				offset: options.offset(),
				collisionBoundary: options.collisionBoundary?.(),
				fallbackAxisSide: options.fallbackAxisSide?.(),
				...(lineAnchor ? { line: options.anchorPoint?.() ?? null } : {}),
				arrow
			}
		);
		// The panel unmounted while floating-ui measured it: nothing left to place or report.
		if (!panel.isConnected) return;
		const anchorHidden =
			!!middlewareData?.hide?.referenceHidden && canReportHidden(reference, anchor.rect);
		writePanelPosition(panel, x, y, strategy, { anchorHidden });
		if (arrow?.isConnected) writeArrowPosition(arrow, placement, middlewareData?.arrow);
		panel.style.setProperty('--transform-origin', transformOriginFor(placement, direction));
		options.onPlace({
			panel,
			placement,
			side: reportedSide(placement, requested, direction),
			align: placementAlign(placement),
			anchorHidden,
			direction,
			mount
		});
	};

	const track: PanelPositioner['track'] = (panel, reference, onReferenceDetached) => {
		// Hidden until the first placement resolves (computePosition is async). Until `size`
		// measures the real space, the panel may use the whole viewport.
		panel.style.visibility = 'hidden';
		panel.style.setProperty('--available-width', '100vw');
		panel.style.setProperty('--available-height', '100dvh');
		void place(panel, true);

		const update = () => {
			// The observers also fire when the reference leaves the document (a `ref` element
			// removed without a teardown): report it instead of placing against a detached node.
			if (reference instanceof Element && !reference.isConnected) {
				onReferenceDetached();
				return;
			}
			void place(panel);
		};
		const stopObserving = autoUpdate(reference, panel, update);

		// floating-ui places the panel on every visual viewport event, but iOS reports the size an
		// on-screen keyboard leaves only after its last `resize`: place the panel once more when
		// the viewport has stayed still, so a dropdown never stays under the keyboard.
		const visualViewport = panel.ownerDocument.defaultView?.visualViewport ?? null;
		let settleTimer: ReturnType<typeof setTimeout> | undefined;
		const onViewportChange = () => {
			clearTimeout(settleTimer);
			settleTimer = setTimeout(update, VIEWPORT_SETTLE_MS);
		};
		visualViewport?.addEventListener('resize', onViewportChange);
		visualViewport?.addEventListener('scroll', onViewportChange);

		return () => {
			clearTimeout(settleTimer);
			visualViewport?.removeEventListener('resize', onViewportChange);
			visualViewport?.removeEventListener('scroll', onViewportChange);
			stopObserving();
		};
	};

	return { place, track };
};
