// One vocabulary for why an overlay opens or closes. Every owner of open state calls
// `onOpenChange(open, details)` *before* it changes that state; `details.cancel()` leaves the
// overlay as it was and the originating event untouched (Base UI's change-event details).

/** Why an overlay asked to open or close. One shared list for every component. */
export type OpenChangeReason =
	/** A press (click, tap, Enter or Space) on the trigger. */
	| 'trigger-press'
	/** The pointer entered the trigger, or left the trigger and popup (hover close). */
	| 'trigger-hover'
	/** Focus moved onto the trigger. */
	| 'trigger-focus'
	/** A press outside the overlay. */
	| 'outside-press'
	/** The Escape key. */
	| 'escape-key'
	/**
	 * A platform close request such as the Android Back gesture (a `CloseWatcher`). Reported with
	 * `interaction: 'touch'`: the event it fires carries no input modality of its own.
	 */
	| 'close-watcher'
	/** A close button inside the overlay. */
	| 'close-press'
	/** An item inside the overlay was chosen (a menu item). */
	| 'item-press'
	/** Arrow-key navigation opened or closed it (a submenu, a listbox). */
	| 'list-navigation'
	/** Typing in the input of a combobox opened or closed its list. */
	| 'input-change'
	/** Focus left the overlay. */
	| 'focus-out'
	/** A swipe gesture dismissed it. */
	| 'swipe'
	/** The trigger it was anchored to left the document. */
	| 'trigger-unmount'
	/** The browser's find-in-page, a text fragment or a `#id` link reached content a disclosure hides. */
	| 'find-in-page'
	/** Code called `open()`, `close()`, `toggle()` or `setOpen()` with no user event behind it. */
	| 'imperative-action';

/** The input modality behind a change; `programmatic` when no user input caused it. */
export type OpenChangeInteraction = 'mouse' | 'touch' | 'pen' | 'keyboard' | 'programmatic';

/** The second argument of every `onOpenChange`. */
export interface OpenChangeDetails {
	/** Why the change was requested. */
	readonly reason: OpenChangeReason;
	/** The DOM event that caused it, when there is one. */
	readonly event?: Event;
	/** The trigger element involved, when a trigger caused it. */
	readonly trigger?: HTMLElement;
	/** The input modality behind the change. */
	readonly interaction: OpenChangeInteraction;
	/**
	 * Keeps the overlay as it was: the state does not change and the originating event is left
	 * untouched (a cancelled Escape is not `defaultPrevented`). Has no effect when the platform
	 * does not allow the request to be refused (a repeated Android Back gesture).
	 */
	cancel(): void;
	/** Whether `cancel()` took effect. */
	readonly isCanceled: boolean;
}

/** `onOpenChange` as every overlay declares it. */
export type OpenChangeHandler = (open: boolean, details: OpenChangeDetails) => void;

/** What a caller knows about a change; the rest is inferred. */
export interface OpenChangeInit {
	reason?: OpenChangeReason;
	event?: Event;
	trigger?: HTMLElement;
	interaction?: OpenChangeInteraction;
	/** `false` when the request cannot be refused: `cancel()` then does nothing. Default `true`. */
	cancelable?: boolean;
}

const BRAND = Symbol('entasis:open-change-details');

const isPointerKind = (value: unknown): value is 'mouse' | 'touch' | 'pen' =>
	value === 'mouse' || value === 'touch' || value === 'pen';

/**
 * The modality behind an event. A click with `detail === 0` and no pointer type is a virtual
 * click: Enter or Space on a control, or a screen reader's activation. `pointerType` is the type
 * of the press that preceded a click, for browsers whose click event does not carry one (Safari).
 */
export function getInteractionType(
	event?: Event | null,
	pointerType?: string | null
): OpenChangeInteraction {
	if (!event) return 'programmatic';
	if (typeof KeyboardEvent !== 'undefined' && event instanceof KeyboardEvent) return 'keyboard';
	if (typeof MouseEvent !== 'undefined' && event instanceof MouseEvent) {
		const own = (event as Partial<PointerEvent>).pointerType;
		if (isPointerKind(own)) return own;
		if (event.type === 'click' && event.detail === 0) return 'keyboard';
		return isPointerKind(pointerType) ? pointerType : 'mouse';
	}
	if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) return 'touch';
	if (typeof FocusEvent !== 'undefined' && event instanceof FocusEvent) return 'keyboard';
	return 'programmatic';
}

/** Builds the details object an owner passes to `onOpenChange`. */
export function createOpenChangeDetails(init: OpenChangeInit = {}): OpenChangeDetails {
	let canceled = false;
	const cancelable = init.cancelable ?? true;
	return {
		[BRAND]: true,
		reason: init.reason ?? 'imperative-action',
		event: init.event,
		trigger: init.trigger,
		interaction: init.interaction ?? getInteractionType(init.event),
		cancel() {
			if (cancelable) canceled = true;
		},
		get isCanceled() {
			return canceled;
		}
	} as OpenChangeDetails;
}

/** Whether `value` is a details object built by `createOpenChangeDetails`. */
export const isOpenChangeDetails = (value: unknown): value is OpenChangeDetails =>
	typeof value === 'object' && value !== null && BRAND in value;

/**
 * Normalises what `open()`, `close()`, `toggle()` and `setOpen()` receive: existing details pass
 * through unchanged (so a nested owner shares the caller's `cancel()`), an `Event` (from
 * `onclick={popover.toggle}`) becomes its `event`, and anything else is an `OpenChangeInit`.
 */
export function resolveOpenChangeDetails(
	init?: OpenChangeDetails | OpenChangeInit | Event | null,
	fallback?: OpenChangeInit
): OpenChangeDetails {
	if (isOpenChangeDetails(init)) return init;
	if (typeof Event !== 'undefined' && init instanceof Event) {
		return createOpenChangeDetails({ ...fallback, event: init });
	}
	return createOpenChangeDetails({ ...fallback, ...(init ?? {}) });
}

/**
 * Runs `onOpenChange` before a change and reports whether the owner may apply it. Call it with
 * the details the change was requested with; it returns `false` when the callback cancelled.
 */
export function requestOpenChange(
	onOpenChange: OpenChangeHandler | undefined,
	open: boolean,
	details: OpenChangeDetails
): boolean {
	onOpenChange?.(open, details);
	return !details.isCanceled;
}
