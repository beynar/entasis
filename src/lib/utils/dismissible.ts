// `dismissible={false}` on Dialog and Popover: an overlay that a person cannot wave away with a
// gesture, but that its own controls and code still close (a form with unsaved changes that asks
// "Discard changes?" first). The refusal happens before `onOpenChange`: a refused gesture never
// becomes a change request, the same way an Escape with `closeOnEscape={false}` does not.
import type { OpenChangeDetails, OpenChangeReason } from './openChange.js';

/**
 * The reasons that are a person dismissing an overlay with a gesture rather than with one of its
 * controls: Escape, a press outside, the platform close request (Android Back), a swipe, and focus
 * moving away. A close button, an item, the trigger, `trigger-unmount` and code are not.
 */
export const DISMISS_GESTURES = [
	'escape-key',
	'outside-press',
	'close-watcher',
	'swipe',
	'focus-out'
] as const satisfies readonly OpenChangeReason[];

/** A reason in `DISMISS_GESTURES`. */
export type DismissGesture = (typeof DISMISS_GESTURES)[number];

/** Whether `reason` is a dismissal by gesture, which `dismissible={false}` refuses. */
export const isDismissGesture = (reason: OpenChangeReason): reason is DismissGesture =>
	(DISMISS_GESTURES as readonly OpenChangeReason[]).includes(reason);

/**
 * Whether a close request must be refused because the overlay is not dismissible, telling
 * `onDismissAttempt` about it when it is. Call before `onOpenChange`: a refused gesture is not
 * reported there.
 */
export function refuseDismissal(
	nextOpen: boolean,
	details: OpenChangeDetails,
	dismissible: boolean | undefined,
	onDismissAttempt: ((details: OpenChangeDetails) => void) | undefined
): boolean {
	if (nextOpen || dismissible !== false || !isDismissGesture(details.reason)) return false;
	onDismissAttempt?.(details);
	return true;
}
