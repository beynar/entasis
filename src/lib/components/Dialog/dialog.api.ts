// The narrow handle Dialog gives its snippets and lifecycle callbacks. The `DialogState` class
// behind it owns the layer registration, focus scope, swipe and snap machinery; none of that is
// public, so it can change without breaking a consumer.
import type { Attachment } from 'svelte/attachments';
import type { OpenTransitionStatus } from '$lib/utils/stateAttributes.js';
import type { PopupTriggerProps } from '$lib/utils/trigger.js';
import type { DialogProps, DialogSnapPoint, DialogType } from './dialog.props.js';
import type { DialogOpenChangeInput } from './dialog.state.svelte.js';

/**
 * The dialog handed to the `trigger` and `children` snippets, `onAfterOpen` and `onAfterClose`:
 * its open state, the requests that change it, and the attachments that make an element its
 * trigger.
 */
export interface DialogApi {
	/** The dialog id, which the open trigger's `aria-controls` points at. */
	readonly id: string;
	/** Whether the dialog is open. */
	readonly isOpen: boolean;
	/**
	 * Where the dialog is in its open/close lifecycle: `closed`, `entering`, `open` or `exiting`
	 * (the values behind `data-entering` and `data-exiting`).
	 */
	readonly status: OpenTransitionStatus;
	/** Whether the dialog is modal. */
	readonly modal: boolean;
	/** The type resolved for the current viewport, after the mobile-sheet collapse. */
	readonly computedType: DialogType;
	/** The point a snap-point drawer rests at, as written in `snapPoints`. */
	readonly currentSnapPoint: DialogSnapPoint | undefined;
	/**
	 * Trigger state in the library's semantic vocabulary (`haspopup`, `expanded`, `controls`), to
	 * spread on a Button. `trigger` and `reference` already write it as ARIA attributes.
	 */
	readonly triggerProps: PopupTriggerProps;
	/** Requests opening through `onOpenChange`. */
	readonly open: (input?: DialogOpenChangeInput) => void;
	/** Requests closing through `onOpenChange`. */
	readonly close: (input?: DialogOpenChangeInput) => void;
	/** Requests the other state through `onOpenChange`. */
	readonly toggle: (input?: DialogOpenChangeInput) => void;
	/** Requests an explicit state; returns `false` when `onOpenChange` cancelled it. */
	setOpen(open: boolean, input?: DialogOpenChangeInput): boolean;
	/**
	 * Moves a snap-point drawer to one of its `snapPoints` (or the nearest to `point`) through
	 * `onSnapPointChange`; returns `false` when it did not move.
	 */
	setSnapPoint(point: DialogSnapPoint, input?: DialogOpenChangeInput): boolean;
	/**
	 * Makes any element the dialog's trigger (`{@attach dialog.trigger}`): `reference`, plus a
	 * click that opens the dialog, and on a non-control `role="button"`, `tabindex="0"` and
	 * Enter/Space activation. The element's own handler runs first.
	 */
	readonly trigger: Attachment<HTMLElement>;
	/**
	 * Keeps a custom trigger's `aria-haspopup`, `aria-expanded` and `aria-controls` in sync and
	 * makes it the element focus returns to, leaving clicks to the element.
	 */
	readonly reference: Attachment<HTMLElement>;
	/** @deprecated Read `status === 'open'`; kept for one minor. */
	readonly hasTransitioned: boolean;
	/**
	 * @deprecated Read `computedType` for the type in effect, or the `type` prop you passed; kept
	 * for one minor.
	 */
	readonly type?: DialogProps['type'];
	/** @deprecated Read the `size` prop you passed; kept for one minor. */
	readonly size?: DialogProps['size'];
}
