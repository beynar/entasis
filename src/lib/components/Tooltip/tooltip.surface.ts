// What the `tooltip()` attachment and `TooltipHost` share about the one tooltip surface: the entry
// a trigger puts on it, the single place where it changes hands (so `onOpenChange` hears about
// every change before it happens), and how the pointer entering the content reaches its trigger.
import {
	createOpenChangeDetails,
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import type { TooltipOptions } from './tooltip.props.js';

/** The tooltip the shared surface shows, and the element it is anchored to. */
export type TooltipEntry = TooltipOptions & { ref: HTMLElement };

/** The slice of the Theme state the surface lives in. */
type TooltipSurfaceOwner = { tooltip: TooltipEntry | null };

/** Pointer travel between a trigger and the content its tooltip shows. */
type ContentHoverListener = (inside: boolean, event?: Event) => void;
const contentHovers = new WeakMap<HTMLElement, ContentHoverListener>();

/** A trigger asks to hear when the pointer enters or leaves the content of its tooltip. */
export const watchTooltipContentHover = (trigger: HTMLElement, listener: ContentHoverListener) => {
	contentHovers.set(trigger, listener);
	return () => {
		if (contentHovers.get(trigger) === listener) contentHovers.delete(trigger);
	};
};

/** The surface reports the pointer moving onto or off the content shown for `trigger`. */
export const reportTooltipContentHover = (trigger: HTMLElement, inside: boolean, event?: Event) =>
	contentHovers.get(trigger)?.(inside, event);

/**
 * Puts `next` on the shared surface (`null` closes it). The callback of the tooltip that opens, or
 * of the one that closes, runs first and may cancel; a tooltip that is pushed off by another one
 * is told afterwards, with a change it cannot cancel. Returns whether the surface changed hands
 * (`true` too when it already showed `next`).
 */
export function requestTooltipChange(
	owner: TooltipSurfaceOwner,
	next: TooltipEntry | null,
	input?: OpenChangeDetails | OpenChangeInit
): boolean {
	const current = owner.tooltip;
	if (!next && !current) return true;
	if (next && current?.ref === next.ref) return true;
	const details = resolveOpenChangeDetails(input, { trigger: (next ?? current)!.ref });
	if (!requestOpenChange((next ?? current)!.onOpenChange, !!next, details)) return false;
	if (next && current) {
		current.onOpenChange?.(
			false,
			createOpenChangeDetails({
				reason: details.reason,
				event: details.event,
				trigger: current.ref,
				interaction: details.interaction,
				cancelable: false
			})
		);
	}
	owner.tooltip = next;
	return true;
}
