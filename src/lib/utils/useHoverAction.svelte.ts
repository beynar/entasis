import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import type { HoverIntentGroup } from './hoverIntent.js';

type HoverActionHandlerOptions = {
	/**
	 * Checked when the pointer enters (no delay starts while inactive), again once the delay
	 * elapses, and when it leaves; never when attaching.
	 */
	isActive: () => boolean;
	/** Receives the `mouseenter` event that began the hover, also once a delay has elapsed. */
	onMouseEnter?: (event: MouseEvent) => void;
	/** Receives the `mouseleave` (or the `mouseout` that stood in for it) that ended the hover. */
	onMouseLeave?: (event: MouseEvent) => void;
	/**
	 * Milliseconds between the pointer entering and `onMouseEnter`. Read on every enter, so a
	 * getter or a function follows a changing value; a function also lets a class field read
	 * options its constructor has not bound yet.
	 */
	delay?: number | (() => number | undefined);
	/**
	 * Pointer types whose hover is ignored. Default `['touch']`: a tap fires compatibility mouse
	 * events, `mouseenter` included, that are not a hover.
	 */
	ignorePointerTypes?: readonly string[];
	/**
	 * Whether a disabled trigger (`:disabled`, `aria-disabled="true"`, or a `data-disabled` other
	 * than `"false"`) is skipped, on enter and again when the delay elapses. Default `true`.
	 * Tooltips opt out: they often explain why their trigger is disabled.
	 */
	skipDisabled?: boolean;
	/** Warm-up group: while it is warm for the trigger, the delay is skipped. */
	group?: () => HoverIntentGroup | null | undefined;
	/** Whether the owner's popup is open. While it is, the owner counts as open in `group`. */
	isOpen?: () => boolean;
	/** Whether a node is inside the owner's open popup; see `HoverIntentMember.contains`. */
	contains?: (node: Node) => boolean;
};

type Timeout = ReturnType<typeof setTimeout>;

/** One attached trigger. */
type HoverTarget = {
	/** Pointer type of the last pointer that entered or pressed the trigger. */
	pointerType: string;
	/** Whether a hover (not an ignored pointer type) is on the trigger. */
	inside: boolean;
	/** The `mouseenter` that began the current hover. */
	enterEvent: MouseEvent | null;
	timeout: Timeout | null;
	/** Removes the `mousemove` listener armed by an enter under a resting pointer. */
	offAwaitMove: (() => void) | null;
};

const DEFAULT_IGNORED_POINTER_TYPES: readonly string[] = ['touch'];

// Where a pointer last moved, shared by every hover trigger. An element that appears under a
// resting pointer (a menu reopened from the keyboard, content the wheel scrolled into place)
// receives `mouseenter` at exactly that point although the pointer never moved onto it. The
// window listener sees a move before the boundary events it causes, so an enter at the recorded
// point is one the pointer did not travel to.
let lastPointer: { x: number; y: number } | null = null;
let pointerTrackers = 0;
let offPointerTracking: (() => void) | null = null;

const trackPointer = () => {
	if (pointerTrackers++ === 0) {
		offPointerTracking = on(
			window,
			'pointermove',
			(event) => {
				lastPointer = { x: event.clientX, y: event.clientY };
			},
			{ capture: true, passive: true }
		);
	}
	let tracking = true;
	return () => {
		if (!tracking) return;
		tracking = false;
		if (--pointerTrackers > 0) return;
		offPointerTracking?.();
		offPointerTracking = null;
		lastPointer = null;
	};
};

// Mouse events report whole pixels where pointer events can be fractional.
const isRestingPointer = (event: MouseEvent) =>
	lastPointer !== null &&
	Math.abs(event.clientX - lastPointer.x) < 1 &&
	Math.abs(event.clientY - lastPointer.y) < 1;

const isDisabledTrigger = (node: HTMLElement) => {
	if (node.matches(':disabled') || node.getAttribute('aria-disabled') === 'true') return true;
	const dataDisabled = node.getAttribute('data-disabled');
	return dataDisabled !== null && dataDisabled !== 'false';
};

/**
 * Delayed hover for a popup trigger. Hover is read from `mouseenter`/`mouseleave`, with the
 * pointer type recorded from the pointer events before them, so a touch tap's compatibility
 * events never count. A pending open needs the pointer still on the trigger when its delay ends:
 * `mouseout` backs up a `mouseleave` that Chrome can drop when the hovered element restyles.
 */
export const useHoverAction = (props: HoverActionHandlerOptions) => {
	// Plain collections: attachments read and write them untracked, and nothing renders them.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- attached triggers, not state
	const targets = new Map<HTMLElement, HoverTarget>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- teardown callbacks, not state
	const offs = new Set<() => void>();
	let isHovered = $state(false);
	const readDelay = () => (typeof props.delay === 'function' ? props.delay() : props.delay) ?? 0;
	const isIgnored = (target: HoverTarget) =>
		(props.ignorePointerTypes ?? DEFAULT_IGNORED_POINTER_TYPES).includes(target.pointerType);
	// An inactive owner (a popover that is already open) starts nothing: a pending open would act
	// on a later state, such as reopening a popover the user just closed.
	const isBlocked = (ref: HTMLElement) =>
		!props.isActive() || (props.skipDisabled !== false && isDisabledTrigger(ref));

	const stopAwaitingMove = (target: HoverTarget) => {
		target.offAwaitMove?.();
		target.offAwaitMove = null;
	};
	const clearPending = (target: HoverTarget) => {
		if (target.timeout !== null) clearTimeout(target.timeout);
		target.timeout = null;
		stopAwaitingMove(target);
	};

	/** Drops every pending delayed enter, so none of them calls `onMouseEnter` any more. */
	const cancel = () => {
		targets.forEach(clearPending);
	};

	const fire = (ref: HTMLElement, target: HoverTarget) => {
		// The pointer left during the delay, even if its `mouseleave` never arrived.
		if (!target.inside) return;
		if (!isBlocked(ref) && target.enterEvent) props.onMouseEnter?.(target.enterEvent);
		isHovered = true;
	};

	const arm = (ref: HTMLElement, target: HoverTarget) => {
		const delay = props.group?.()?.isWarm(ref) ? 0 : readDelay();
		if (!delay) {
			fire(ref, target);
			return;
		}
		target.timeout = setTimeout(() => {
			target.timeout = null;
			fire(ref, target);
		}, delay);
	};

	const enter = (ref: HTMLElement, target: HoverTarget, event: MouseEvent) => {
		clearPending(target);
		if (isIgnored(target)) return;
		target.inside = true;
		target.enterEvent = event;
		if (isBlocked(ref)) return;
		if (!isRestingPointer(event)) {
			arm(ref, target);
			return;
		}
		// The trigger arrived under a resting pointer: it is hovered once the pointer moves on it.
		target.offAwaitMove = on(ref, 'mousemove', () => {
			stopAwaitingMove(target);
			if (!target.inside || isIgnored(target) || isBlocked(ref)) return;
			arm(ref, target);
		});
	};

	const leave = (target: HoverTarget, event: MouseEvent) => {
		clearPending(target);
		if (!target.inside) return;
		target.inside = false;
		target.enterEvent = null;
		if (props.isActive()) props.onMouseLeave?.(event);
		isHovered = false;
	};

	// While the owner's popup is open it keeps the group warm for the next hover target.
	if (props.isOpen) {
		$effect(() => {
			const group = props.group?.();
			if (!group || !props.isOpen?.()) return;
			return untrack(() => group.join({ contains: props.contains }));
		});
	}

	const destroy = () => {
		offs.forEach((off) => off());
		offs.clear();
		cancel();
		isHovered = false;
	};
	onDestroy(destroy);

	return {
		// Always listens: `isActive` is checked when the pointer moves, so an element attached
		// while the owner is inactive (a popover that starts open, a disabled trigger enabled
		// later) still responds once it is active.
		reference: (ref: HTMLElement) => {
			return untrack(() => {
				const target: HoverTarget = {
					pointerType: '',
					inside: false,
					enterEvent: null,
					timeout: null,
					offAwaitMove: null
				};
				targets.set(ref, target);
				const recordPointerType = (event: PointerEvent) => {
					target.pointerType = event.pointerType;
				};
				const listeners = [
					trackPointer(),
					on(ref, 'pointerenter', recordPointerType),
					on(ref, 'pointerdown', recordPointerType),
					on(ref, 'mouseenter', (event) => enter(ref, target, event)),
					on(ref, 'mouseleave', (event) => leave(target, event)),
					// Bubbles from descendants too; only a move to outside the trigger is a leave.
					on(ref, 'mouseout', (event) => {
						const next = event.relatedTarget;
						if (next instanceof Node && ref.contains(next)) return;
						leave(target, event);
					})
				];

				const off = () => {
					listeners.forEach((stop) => stop());
					clearPending(target);
					if (targets.get(ref) === target) targets.delete(ref);
					offs.delete(off);
				};
				offs.add(off);
				return off;
			});
		},
		destroy,
		/**
		 * Cancels pending delayed enters. Owners call it when their state changes another way (a
		 * click, Escape), so a hover that began before the change cannot undo it afterwards.
		 */
		cancel,
		get isHovered() {
			return isHovered;
		}
	};
};
