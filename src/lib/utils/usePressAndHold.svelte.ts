import { onDestroy, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';

/** Milliseconds between the press and the first repeat. */
export const PRESS_AND_HOLD_DELAY = 400;
/** Milliseconds between repeats. */
export const PRESS_AND_HOLD_INTERVAL = 60;
/** Touch travel in px that turns a press into a scroll. */
const SCROLL_DISTANCE = 8;
/** A touch press waits this long before it counts as a hold rather than the start of a scroll. */
const TOUCH_INTENT_MS = 50;
/** More touch moves than this during the intent wait read as a scroll or a pinch. */
const MAX_TOUCH_INTENT_MOVES = 3;

type Timer = ReturnType<typeof setTimeout>;

export type PressAndHoldOptions = {
	/**
	 * One step. Runs on the press and then on every repeat; return `false` to stop repeating, for
	 * example when the value reached a bound. Receives the event that started the hold.
	 */
	onStep: (event: Event) => boolean | void;
	/**
	 * Checked before every step. While it returns true no hold starts, and a running one stops as
	 * soon as it does (disabled or read-only mid-hold).
	 */
	disabled?: () => boolean;
	/** Milliseconds between the press and the first repeat. Default `PRESS_AND_HOLD_DELAY`. */
	delay?: number;
	/** Milliseconds between repeats. Default `PRESS_AND_HOLD_INTERVAL`. */
	interval?: number;
	/** Touch travel in px that turns the press into a scroll and stops it. Default 8. */
	scrollDistance?: number;
	/** The press ended: the pointer was released or cancelled. */
	onStop?: () => void;
};

/**
 * Press-and-hold repetition for stepper buttons. A mouse or pen press steps at once, then repeats
 * after `delay` every `interval` until the pointer is released or cancelled, the step returns
 * `false` or `disabled` turns true; moving off the button pauses it and coming back resumes. A
 * touch press waits briefly so a scroll that starts on the button never steps, and a quick tap is
 * left to the button's click. Pair the attachment with `shouldSkipClick` in the click handler so
 * the click after a press does not step twice while keyboard activation still steps once.
 */
export const usePressAndHold = (options: PressAndHoldOptions) => {
	let pressed = false;
	let pointerType = '';
	let ignoreClick = false;
	let downX = 0;
	let downY = 0;
	let touchMoves = 0;
	let intentTimer: Timer | null = null;
	/** The pending step: the first repeat after `delay`, then each one after `interval`. */
	let stepTimer: Timer | null = null;
	let offContextMenu: (() => void) | null = null;
	let offRelease: (() => void) | null = null;

	const isTouch = (type: string) => type === 'touch';
	const isDisabled = () => options.disabled?.() === true;

	/** Stops stepping; a pressed pointer can still resume it by coming back onto the button. */
	const stopRepeating = () => {
		if (stepTimer !== null) clearTimeout(stepTimer);
		stepTimer = null;
		offContextMenu?.();
		offContextMenu = null;
	};

	const clearIntent = () => {
		if (intentTimer !== null) clearTimeout(intentTimer);
		intentTimer = null;
		touchMoves = 0;
	};

	const start = (event: Event) => {
		stopRepeating();
		if (isDisabled()) return;
		// A long touch press would otherwise open the browser's context menu over the button.
		offContextMenu = on(window, 'contextmenu', (contextEvent) => contextEvent.preventDefault());
		if (options.onStep(event) === false) {
			stopRepeating();
			return;
		}
		const interval = options.interval ?? PRESS_AND_HOLD_INTERVAL;
		const repeat = () => {
			stepTimer = null;
			if (isDisabled() || options.onStep(event) === false) {
				stopRepeating();
				return;
			}
			stepTimer = setTimeout(repeat, interval);
		};
		// Repeating starts once the delay has passed: its first step lands an interval later.
		stepTimer = setTimeout(() => {
			stepTimer = setTimeout(repeat, interval);
		}, options.delay ?? PRESS_AND_HOLD_DELAY);
	};

	const release = () => {
		if (!pressed && offRelease === null) return;
		pressed = false;
		clearIntent();
		stopRepeating();
		offRelease?.();
		offRelease = null;
		options.onStop?.();
	};

	/** Stops a running hold now, as a release would. */
	const stop = () => release();

	const down = (event: PointerEvent) => {
		if (event.defaultPrevented || event.button !== 0 || isDisabled()) return;
		release();
		pressed = true;
		pointerType = event.pointerType;
		ignoreClick = false;
		downX = event.clientX;
		downY = event.clientY;
		// The release can land anywhere; an ancestor stopping it is covered by the node's own listener.
		const offUp = on(window, 'pointerup', release);
		const offCancel = on(window, 'pointercancel', release);
		offRelease = () => {
			offUp();
			offCancel();
		};
		if (!isTouch(event.pointerType)) {
			// Mouse and pen: step now, and keep the press from selecting text.
			event.preventDefault();
			start(event);
			return;
		}
		clearIntent();
		intentTimer = setTimeout(() => {
			const moves = touchMoves;
			clearIntent();
			if (!pressed || moves > MAX_TOUCH_INTENT_MOVES) return;
			start(event);
			// The click a touch hold ends with must not step once more.
			ignoreClick = true;
		}, TOUCH_INTENT_MS);
	};

	const move = (event: PointerEvent) => {
		if (!pressed || !isTouch(event.pointerType)) return;
		touchMoves += 1;
		const distance = Math.hypot(event.clientX - downX, event.clientY - downY);
		if (distance > (options.scrollDistance ?? SCROLL_DISTANCE)) {
			clearIntent();
			stopRepeating();
		}
	};

	// Mouse and pen only: a touch has no hover, its pointer leaves when it lifts.
	const pause = (event: PointerEvent) => {
		if (pressed && !isTouch(event.pointerType)) stopRepeating();
	};
	const resume = (event: PointerEvent) => {
		if (pressed && !isTouch(event.pointerType) && !isTouch(pointerType)) start(event);
	};

	$effect(() => {
		if (isDisabled()) untrack(stopRepeating);
	});

	onDestroy(() => {
		clearIntent();
		stopRepeating();
		offRelease?.();
		offRelease = null;
		pressed = false;
	});

	const attachment: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			const offs = [
				on(node, 'pointerdown', down),
				on(node, 'pointermove', move),
				on(node, 'pointerup', release),
				on(node, 'pointerleave', pause),
				on(node, 'pointerenter', resume)
			];
			return () => {
				offs.forEach((off) => off());
				clearIntent();
				stopRepeating();
				offRelease?.();
				offRelease = null;
				pressed = false;
			};
		});

	/**
	 * For the button's click handler: true when the click must not step. A mouse or pen press
	 * already stepped on pointerdown, and a touch hold already repeated; a keyboard activation
	 * (`detail` 0) and a quick touch tap still step through the click.
	 */
	const shouldSkipClick = (event: MouseEvent): boolean => {
		if (event.defaultPrevented) return true;
		if (isTouch(pointerType)) return ignoreClick;
		return event.detail !== 0;
	};

	return { attachment, shouldSkipClick, stop };
};
