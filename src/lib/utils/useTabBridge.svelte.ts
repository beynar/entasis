// Tab order for a panel rendered somewhere else in the document (a popover portaled to the end of
// <body>). The panel is not next to its trigger in the page, so the engine's own Tab skips it:
//
// - Tab on the open trigger enters the panel.
// - Tab past the panel's last control continues after the trigger and closes the panel.
// - Shift+Tab on the panel's first control returns to the trigger.
// - When nothing follows the trigger, the engine's Tab is left alone: sending focus back to the
//   start of the panel would loop for ever. Inside a modal scope (the trigger is the last control
//   of a dialog) it wraps to the scope's first control instead, as the scope's own Tab would.
//
// The listeners sit on the trigger and on the panel, not on the document, so they run before a
// surrounding modal scope's document-level Tab handling and after a control's own key handling.
import { on } from 'svelte/events';
import {
	composedContains,
	getDeepActiveElement,
	getTabbableAfter,
	getTabbableElements
} from './focus.js';
import { findTrappingScope } from './useFocusScope.svelte.js';

export interface TabBridgeOptions {
	/** The bridge is live: the panel is open, placed and nothing above it owns Tab. */
	isActive: () => boolean;
	/** The element that has focus while the panel is open; `null` turns the bridge off. */
	anchor: () => HTMLElement | null;
	/** The panel element. */
	panel: () => HTMLElement | null;
	/** Limits where "after the trigger" is looked for, for a trigger inside another panel. */
	boundary?: () => HTMLElement | undefined;
	/** Tab went past the panel's last control and focus moved on; close the panel. */
	onLeave: (event: KeyboardEvent) => void;
}

const FOCUS_VISIBLE = { preventScroll: true, focusVisible: true } as FocusOptions;

/**
 * Bridges Tab between a trigger and its portaled panel. Call during component initialisation
 * (it registers an effect). Returns whether a key press was handled, for tests and owners that
 * want to chain their own handling.
 */
export function useTabBridge(options: TabBridgeOptions) {
	const enterPanel = (event: KeyboardEvent, panel: HTMLElement) => {
		const first = getTabbableElements(panel)[0];
		if (!first) return;
		event.preventDefault();
		first.focus(FOCUS_VISIBLE);
	};

	const leavePanel = (event: KeyboardEvent, panel: HTMLElement, anchor: HTMLElement) => {
		const next = getTabbableAfter(anchor, {
			exclude: panel,
			boundary: options.boundary ? options.boundary() : undefined
		});
		let target = next;
		if (!target) {
			// Nothing follows. In a modal scope the page behind is inert, so the engine would leave
			// the scope: wrap to its first control. Anywhere else the engine moves on, so Tab cannot
			// cycle between the trigger and the panel.
			const scope = findTrappingScope(anchor);
			if (!scope) return;
			target =
				getTabbableElements(scope).find((element) => !composedContains(panel, element)) ?? null;
			if (!target) return;
		}
		event.preventDefault();
		target.focus(FOCUS_VISIBLE);
		options.onLeave(event);
	};

	const handleKey = (event: KeyboardEvent) => {
		if (event.key !== 'Tab' || event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey) return;
		if (!options.isActive()) return;
		const anchor = options.anchor();
		const panel = options.panel();
		if (!anchor || !panel || !anchor.isConnected) return;
		const active = getDeepActiveElement(anchor.ownerDocument);
		if (!active) return;

		if (active === anchor) {
			if (!event.shiftKey) enterPanel(event, panel);
			return;
		}
		if (!composedContains(panel, active)) return;

		const tabbable = getTabbableElements(panel);
		const index = active instanceof HTMLElement ? tabbable.indexOf(active) : -1;
		if (event.shiftKey) {
			// Back from the first control, or from the panel itself when it holds focus. Anything
			// else is the engine's to move: an item the list does not know has a control before it.
			if (index === 0 || active === panel) {
				event.preventDefault();
				anchor.focus(FOCUS_VISIBLE);
			}
			return;
		}
		if (active === panel) {
			if (tabbable.length > 0) enterPanel(event, panel);
			else leavePanel(event, panel, anchor);
			return;
		}
		if (index >= 0 && index === tabbable.length - 1) leavePanel(event, panel, anchor);
	};

	$effect(() => {
		if (!options.isActive()) return;
		const anchor = options.anchor();
		const panel = options.panel();
		if (!anchor || !panel) return;
		const offAnchor = on(anchor, 'keydown', handleKey);
		const offPanel = on(panel, 'keydown', handleKey);
		return () => {
			offAnchor();
			offPanel();
		};
	});

	return { handleKey };
}
