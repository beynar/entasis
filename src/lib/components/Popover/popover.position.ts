// Floating placement for Popover panels: the floating-ui middleware chain, the coordinates written
// on the portaled wrapper, the motion that starts from the side facing the reference, and the
// autoUpdate wiring. PopoverState owns the reactive state (open state, the panel's minimum width,
// its transform origin) and hands the positioner getters for its inputs and callbacks for its
// outputs. The getters are read when a placement runs; the synchronous part of the mount
// placement runs inside the panel attachment, so the inputs it reads re-place a mounted panel
// when they change.
import {
	autoUpdate,
	computePosition,
	flip,
	hide,
	offset,
	shift,
	type Alignment,
	type Placement,
	type Side,
	type Strategy,
	type VirtualElement
} from '@floating-ui/dom';
import type { PopoverProps } from './popover.props.js';

/** What a floating panel is placed against: the trigger, the `ref` element, or a virtual point. */
export type PopoverReference = HTMLElement | VirtualElement;

/** Gap in px between the reference and the panel when `offset` is unset. */
const DEFAULT_OFFSET = 4;
/** Space in px that `flip` and `shift` keep between the panel and the viewport edges. */
const VIEWPORT_PADDING = 20;
/** Distance in px a directed transition travels along the placement axis. */
const DIRECTED_DISTANCE = 10;

/** The floating-ui middleware every floating panel is placed with, in order. */
export const panelMiddleware = (gap: number | undefined) => [
	offset(gap ?? DEFAULT_OFFSET),
	flip({
		mainAxis: true,
		crossAxis: true,
		padding: VIEWPORT_PADDING
	}),
	shift({
		mainAxis: true,
		crossAxis: true,
		padding: VIEWPORT_PADDING
	}),
	hide()
];

/** Asks floating-ui where the panel goes: viewport-fixed coordinates and the placement after flipping. */
export const computePanelPosition = (
	reference: PopoverReference,
	panel: HTMLElement,
	options: { placement: Placement; offset: number | undefined }
) =>
	computePosition(reference, panel, {
		strategy: 'fixed',
		placement: options.placement,
		middleware: panelMiddleware(options.offset)
	});

/**
 * Puts the wrapper at viewport coordinates and reveals it: a floating panel stays hidden until
 * its first placement lands, so it never flashes at the top-left corner.
 */
export const writePanelPosition = (
	panel: HTMLElement,
	x: number,
	y: number,
	strategy: Strategy = 'fixed'
) => {
	Object.assign(panel.style, {
		position: strategy,
		left: `${x}px`,
		top: `${y}px`,
		visibility: ''
	});
};

/**
 * Hands the wrapper back to the document's layout (an inline panel, a mobile sheet). `reveal`
 * also clears the visibility a floating panel is hidden with until placed.
 */
export const releasePanelPosition = (panel: HTMLElement, reveal: boolean) => {
	Object.assign(
		panel.style,
		reveal
			? { position: '', left: '', top: '', visibility: '' }
			: { position: '', left: '', top: '' }
	);
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
 * and scales from the origin computed for its side and alignment.
 */
export const directedMotion = (placement: Placement): DirectedMotion => {
	const side = placement.split('-')[0] as Side;
	const alignment = placement.split('-')[1] as Alignment;
	const transformOriginY = side === 'top' ? 'bottom' : side === 'bottom' ? 'top' : 'center';
	const transformOriginX =
		alignment === 'start' ? 'left' : alignment === 'end' ? 'right' : 'center';
	return {
		transformOrigin: `${transformOriginX} ${transformOriginY}`,
		axis: side === 'top' || side === 'bottom' ? 'y' : 'x',
		distance: side === 'top' || side === 'left' ? DIRECTED_DISTANCE : -DIRECTED_DISTANCE
	};
};

/** One written placement, reported to the owner. */
export interface PanelPlacement {
	/** The positioned wrapper. */
	panel: HTMLElement;
	/** The placement floating-ui resolved after flipping; `null` when `positionPanel` placed the panel. */
	placement: Placement | null;
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
	/** The preferred placement, resolved from responsive values. */
	placement: () => Placement;
	/** Gap in px between the reference and the panel; `undefined` uses the default. */
	offset: () => number | undefined;
	/** Whether the panel is at least as wide as the reference. */
	fitTrigger: () => boolean;
	/** The consumer's own placement, tried before floating-ui. */
	positionPanel: () => PopoverProps['positionPanel'];
	/**
	 * Receives the panel's minimum width in px: the reference width (`fitTrigger`), the
	 * `minWidth` returned by `positionPanel`, or `null` when the panel is not floating.
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
	 * resize, either element's size). `onReferenceDetached` runs instead of a placement once an
	 * element reference has left the document. Returns the cleanup.
	 */
	track: (
		panel: HTMLElement,
		reference: PopoverReference,
		onReferenceDetached: () => void
	) => () => void;
}

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
		if (options.fitTrigger()) {
			options.setMinWidth(reference.getBoundingClientRect().width);
		}

		const custom = options.positionPanel()?.({ panel, reference });
		if (custom) {
			if (custom.minWidth != null) options.setMinWidth(custom.minWidth);
			writePanelPosition(panel, custom.x, custom.y);
			options.onPlace({ panel, placement: null, mount });
			return;
		}

		const { x, y, strategy, placement } = await computePanelPosition(reference, panel, {
			placement: options.placement(),
			offset: options.offset()
		});
		writePanelPosition(panel, x, y, strategy);
		options.onPlace({ panel, placement, mount });
	};

	const track: PanelPositioner['track'] = (panel, reference, onReferenceDetached) => {
		// Hidden until the first placement resolves (computePosition is async).
		panel.style.visibility = 'hidden';
		void place(panel, true);
		return autoUpdate(reference, panel, () => {
			// The observers also fire when the reference leaves the document (a `ref` element
			// removed without a teardown): report it instead of placing against a detached node.
			if (reference instanceof Element && !reference.isConnected) {
				onReferenceDetached();
				return;
			}
			void place(panel);
		});
	};

	return { place, track };
};
