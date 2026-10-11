/**
 * The shared state attributes every component exposes as styling hooks. They are presence
 * attributes: `''` while the state holds and omitted otherwise, so `[data-open]` selectors and
 * Tailwind's `data-open:` variant work without values. `data-side` and `data-align` carry a value.
 *
 * Spread the returned objects on rendered elements (`{...openStateAttributes(open)}`); use
 * `applyStateAttributes` for elements a component manages imperatively. Components keep their
 * existing `data-state` values alongside these for compatibility.
 */
import type { Placement } from '@floating-ui/dom';

/** A presence attribute value: `''` sets the attribute, `undefined` omits it. */
export type Presence = '' | undefined;

/** `''` when `on` is truthy, `undefined` otherwise. */
export const presence = (on: unknown): Presence => (on ? '' : undefined);

/** Lifecycle of anything that opens and closes with a transition. */
export type OpenTransitionStatus = 'closed' | 'entering' | 'open' | 'exiting';

export type OpenStateAttributes = {
	'data-open': Presence;
	'data-closed': Presence;
};

/** `data-open` while open, `data-closed` otherwise (including while the exit transition plays). */
export const openStateAttributes = (open: boolean): OpenStateAttributes => ({
	'data-open': presence(open),
	'data-closed': presence(!open)
});

export type TransitionStatusAttributes = {
	'data-entering': Presence;
	'data-exiting': Presence;
};

/** `data-entering` while the enter transition plays, `data-exiting` while the exit one plays. */
export const transitionStatusAttributes = (
	status: OpenTransitionStatus | undefined
): TransitionStatusAttributes => ({
	'data-entering': presence(status === 'entering'),
	'data-exiting': presence(status === 'exiting')
});

/** The side of the anchor a popup sits on. */
export type PopupSide = 'top' | 'right' | 'bottom' | 'left';
/** How a popup lines up with its anchor along that side. */
export type PopupAlign = 'start' | 'center' | 'end';

/** Splits a floating-ui placement (`bottom-start`) into its side and alignment. */
export const parsePlacement = (placement: Placement): { side: PopupSide; align: PopupAlign } => {
	const [side, align] = placement.split('-') as [PopupSide, 'start' | 'end' | undefined];
	return { side, align: align ?? 'center' };
};

export type PlacementAttributes = {
	'data-side': PopupSide | undefined;
	'data-align': PopupAlign | undefined;
	'data-anchor-hidden': Presence;
};

/**
 * `data-side` and `data-align` from the resolved placement (not the requested one, which a flip
 * may have changed), and `data-anchor-hidden` while the anchor is scrolled out of view.
 */
export const placementAttributes = (
	placement: Placement | { side: PopupSide; align?: PopupAlign } | undefined,
	{ anchorHidden = false }: { anchorHidden?: boolean } = {}
): PlacementAttributes => {
	const resolved =
		placement === undefined
			? undefined
			: typeof placement === 'string'
				? parsePlacement(placement)
				: { side: placement.side, align: placement.align ?? 'center' };
	return {
		'data-side': resolved?.side,
		'data-align': resolved?.align,
		'data-anchor-hidden': presence(anchorHidden)
	};
};

export type PopupTriggerAttributes = {
	'data-popup-open': Presence;
};

/** `data-popup-open` on a trigger while the popup it controls is open. */
export const popupTriggerAttributes = (open: boolean): PopupTriggerAttributes => ({
	'data-popup-open': presence(open)
});

export type ItemState = {
	/** The keyboard or pointer highlight is on the item. */
	highlighted?: boolean;
	/** The item cannot be chosen. */
	disabled?: boolean;
	/** The item is chosen (selected, checked or current). */
	selected?: boolean;
};

export type ItemStateAttributes = {
	'data-highlighted': Presence;
	'data-disabled': Presence;
	'data-selected': Presence;
};

/** `data-highlighted`, `data-disabled` and `data-selected` for an option, menu item or row. */
export const itemStateAttributes = ({
	highlighted,
	disabled,
	selected
}: ItemState): ItemStateAttributes => ({
	'data-highlighted': presence(highlighted),
	'data-disabled': presence(disabled),
	'data-selected': presence(selected)
});

/**
 * Writes attributes onto an element Svelte doesn't render: a string sets the attribute, `undefined`
 * or `null` removes it.
 */
export const applyStateAttributes = (
	element: Element,
	attributes: Readonly<Record<string, string | null | undefined>>
): void => {
	for (const [name, value] of Object.entries(attributes)) {
		if (value == null) element.removeAttribute(name);
		else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
	}
};

/**
 * What each shared state attribute means. Components build their documented styling-hook maps
 * from these entries so the wording stays the same everywhere.
 */
export const stateDataAttributes = {
	'data-open': 'Present while open.',
	'data-closed': 'Present while closed, including during the exit transition.',
	'data-entering': 'Present while the enter transition plays.',
	'data-exiting': 'Present while the exit transition plays.',
	'data-side': 'The side of the anchor the popup sits on: top, right, bottom or left.',
	'data-align': 'The alignment with the anchor: start, center or end.',
	'data-anchor-hidden': 'Present while the anchor is scrolled out of view.',
	'data-popup-open': 'Present on a trigger while its popup is open.',
	'data-highlighted': 'Present on the item the keyboard or pointer highlights.',
	'data-disabled': 'Present while disabled.',
	'data-selected': 'Present while selected or checked.'
} as const;

/** The name of a shared state attribute. */
export type StateDataAttribute = keyof typeof stateDataAttributes;
