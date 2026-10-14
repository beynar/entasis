// The narrow handle Popover gives its snippets and lifecycle callbacks. The `PopoverState` class
// behind it owns layers, focus scopes, safe areas and hover tracking; none of that is public, so
// it can change without breaking a consumer.
import type { Attachment } from 'svelte/attachments';
import type { OpenTransitionStatus } from '$lib/utils/stateAttributes.js';
import type { PopupTriggerProps } from '$lib/utils/trigger.js';
import type { PopoverOpenReason } from './popover.props.js';
import type { PopoverOpenChangeInput, PopoverPlacementState } from './popover.state.svelte.js';

/**
 * The popover handed to the `trigger` and `children` snippets, `onAfterOpen` and `onAfterClose`:
 * its open state, the requests that change it, and the attachments that make an element its
 * trigger. Type a snippet parameter `PopoverApi<Row>` to read `payload` as a `Row`.
 */
export interface PopoverApi<Payload = unknown> {
	/** The popover id, which the open trigger's `aria-controls` points at. */
	readonly id: string;
	/** Whether the popover is open. */
	readonly isOpen: boolean;
	/**
	 * Where the panel is in its open/close lifecycle: `closed`, `entering`, `open` or `exiting`
	 * (the values behind `data-entering` and `data-exiting`).
	 */
	readonly status: OpenTransitionStatus;
	/**
	 * How the open popover was opened: `hover`, `press`, `keyboard`, or `programmatic` (`open()`
	 * from code, the `open` prop, `defaultOpen`). `null` once closed.
	 */
	readonly openReason: PopoverOpenReason | null;
	/** The trigger that opened the popover, while it is open; `null` after a programmatic open. */
	readonly activeTrigger: HTMLElement | null;
	/**
	 * Where the floating panel was last placed: its side, alignment, and whether its anchor is
	 * scrolled out of view (the values of `data-side`, `data-align` and `data-anchor-hidden`).
	 * `null` until the first placement lands and once the panel unmounts.
	 */
	readonly placement: PopoverPlacementState | null;
	/**
	 * Trigger state in the library's semantic vocabulary (`haspopup`, `expanded`, `controls`), to
	 * spread on a Button. `trigger` and `reference` already write it as ARIA attributes.
	 */
	readonly triggerProps: PopupTriggerProps;
	/**
	 * The payload of the trigger the panel is anchored to (see `triggerFor`); `undefined` for a
	 * trigger made without one.
	 */
	readonly payload: Payload | undefined;
	/** Requests opening through `onOpenChange`. */
	readonly open: (input?: PopoverOpenChangeInput) => void;
	/** Requests closing through `onOpenChange`; returns `false` when it was cancelled. */
	readonly close: (input?: PopoverOpenChangeInput) => boolean;
	/**
	 * Requests the other state. A press on the trigger of a hover-opened popover pins it open; on
	 * another trigger of an open popover it moves the panel there.
	 */
	readonly toggle: (input?: PopoverOpenChangeInput) => void;
	/** Requests an explicit state; returns `false` when `onOpenChange` cancelled it. */
	readonly setOpen: (open: boolean, input?: PopoverOpenChangeInput) => boolean;
	/**
	 * Makes any element a complete trigger (`{@attach popover.trigger}`): it anchors the panel,
	 * toggles it on click when `openOnClick` allows, keeps `aria-haspopup`, `aria-expanded` and
	 * `aria-controls` in sync, and gives a non-control `role="button"`, `tabindex="0"` and
	 * Enter/Space activation. The element's own handler runs first.
	 */
	readonly trigger: Attachment<HTMLElement>;
	/**
	 * Anchors the panel to an element and keeps its ARIA state in sync, leaving clicks and keys to
	 * the element (`{@attach popover.reference}`).
	 */
	readonly reference: Attachment<HTMLElement>;
	/**
	 * `trigger` plus a payload getter, read back as `payload` while this trigger anchors the panel:
	 * `{@attach popover.triggerFor(() => row)}`.
	 */
	readonly triggerFor: (payload: () => Payload) => Attachment<HTMLElement>;
	/** @deprecated Read `status === 'open'`; kept for one minor. */
	readonly hasTransitioned: boolean;
}
