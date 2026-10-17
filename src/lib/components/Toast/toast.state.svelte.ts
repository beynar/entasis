import { ThemeState, useTheme } from '../Theme/theme.state.svelte.js';
import { Timer, WINDOW_INACTIVE_REASON, watchWindowActivity } from '$lib/utils/timer.svelte.js';
import { useLiveRegions } from '$lib/utils/useLiveAnnouncer.svelte.js';
import { DEV } from 'esm-env';
import { onMount, tick, untrack } from 'svelte';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Slot } from '../Slot/slot.js';
import type { FSOParams, FSOProps } from '$lib/transitions/transition.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import { createId } from '$lib/utils/id.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { useToastMotion, type ToastThemeProps } from './toast.theme.js';

export type ToastPosition =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right'
	| 'top-center'
	| 'bottom-center'
	// Full screen-width bars pinned flush to the top or bottom edge.
	| 'banner-top'
	| 'banner-bottom';

/**
 * A button rendered inside the toast (full Button props, with its label as
 * `content`). Clicking it runs its `onclick` and then — unless `dismiss: false` —
 * dismisses the toast. Because a manual dismiss fires `onDismiss` and not
 * `onAutoDismiss`, this is exactly what makes the deferred-commit / Undo pattern
 * work: put the real destructive action in `onAutoDismiss` (runs only on timeout),
 * and an Undo action here cancels it just by closing the toast early.
 */
export type ToastAction = ButtonProps & {
	/** The button's label. */
	content?: string;
	/** Whether clicking the button dismisses the toast. @default true */
	dismiss?: boolean;
};

export type ToastOptions = {
	/** Stable toast identifier. */
	id: string;
	/** Semantic toast geometry. */
	size?: Sizes;
	/** Dismisses the toast when its body is clicked. @default false */
	closeOnClick?: boolean;
	/** Allows dragging the toast toward its screen edge to dismiss it. @default true */
	swipeToDismiss?: boolean;
	/** Shows a close button. */
	showCloseIcon?: boolean;
	/** Automatic dismissal delay in milliseconds, or false to keep the toast open. */
	duration?: number | false;
	/** Allows manual dismissal. */
	dismissible?: boolean;
	/** Uses the semantic color as a prominent background. */
	richColors?: boolean;
	/** Leading content, or false to suppress it. */
	prefix?: Slot | false;
	/** Trailing content. */
	suffix?: Slot;
	/** Action buttons rendered inside the toast. */
	actions?: ToastAction[];
	/** Content of the close button. */
	closeIcon?: Slot;
	/** Enter and exit transition overrides for this toast; wins over the `motion` slot. */
	transition?: FSOProps;
	/** Shows a loading indicator. */
	loading?: boolean;
	/** Shows the remaining automatic dismissal time as a progress bar. */
	progress?: boolean;
	/** Main toast content. */
	title?: Slot;
	/** Supporting content below the title. */
	description?: Slot;
	/** Semantic palette role. */
	color: Colors;
	/**
	 * Without an `id`, a toast whose color, title and description match one still on screen
	 * updates that toast (its timer restarts) instead of stacking a duplicate. Applies only to
	 * plain-text title and description; pass `false` to always add a new toast. Default `true`.
	 */
	dedupe?: boolean;
	/** Announces the toast with an assertive live region. */
	important?: boolean;
	/** Icon text displayed before the toast content. */
	icon?: string;
	/** Called once for manual dismissal, including an action or remove(). */
	onDismiss?: (payload: Toast) => void;
	/** Called after the toast's entry transition finishes. */
	onAfterOpen?: (payload: Toast) => void;
	/** Called once when the duration expires; manual dismissal cancels it. */
	onAutoDismiss?: (payload: Toast) => void;
	/** Screen position for this toast. */
	position?: ToastPosition;
	/** Theme overrides for this toast alone, layered over the Toaster's `theme`. */
	theme?: ToastThemeProps;
};

export type ToasterProps = Pick<
	ToastOptions,
	| 'size'
	| 'closeOnClick'
	| 'swipeToDismiss'
	| 'showCloseIcon'
	| 'duration'
	| 'dismissible'
	| 'richColors'
	| 'prefix'
	| 'suffix'
	| 'closeIcon'
	| 'progress'
> & {
	/** Per-instance toast theme overrides. */
	theme?: ToastThemeProps;
	/** Per-instance i18n overrides, merged over the global catalog. */
	i18n?: Partial<import('$lib/i18n/en.js').Messages>;
	/** Collapses the toast stack horizontally at the selected breakpoints. */
	collapseHorizontalAxis?: ResponsiveProps<boolean>;
	/** Keeps the toast stack expanded. */
	expand?: boolean;
	/** Maximum number of visible toasts. */
	visibleToasts?: number;
	/** Gap between stacked toasts in pixels. */
	gap?: number;
	/** Distance from the screen edge in pixels. */
	offset?: number;
	/** Text and layout direction of the toast region. Inherited from the page when omitted. */
	direction?: 'ltr' | 'rtl';
	/** Responsive default screen position. */
	position?: ResponsiveProps<ToastPosition>;
	/** Enter and exit transition overrides applied to every toast; the per-toast `transition` wins. */
	transition?: FSOProps;
	/** Stack perspective amount from 0 to 100. */
	perspectiveAmount?: number;
};

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
/** The options exactly as a `toast()` call supplied them, before Toaster defaults. */
type ToastRequest = Omit<ToastOptions, 'id'> & { id: string };

/** Options a later call changes on a toast that is already on screen; keys left out keep their value. */
export type ToastUpdate = Partial<Omit<ToastOptions, 'id'>>;
/**
 * What `toast.update()` and `Toast.update()` accept: a patch, or a function that receives the
 * toast's current options, Toaster defaults included, and returns the patch.
 */
export type ToastUpdater = ToastUpdate | ((current: Readonly<ToastOptions>) => ToastUpdate);
/** A stage of `toast.promise()`: a title, or options for the toast in that stage. */
type ToastPromiseStage<Value> = string | ToastUpdate | ((value: Value) => string | ToastUpdate);
export type ToastPromiseOptions<Result = unknown> = {
	/** Shown while the promise is pending: a spinner that stays until the promise settles. */
	loading: string | ToastUpdate;
	/** Shown when the promise resolves, or computed from its result. */
	success: ToastPromiseStage<Result>;
	/** Shown when the promise rejects, or computed from the rejection. */
	error: ToastPromiseStage<unknown>;
	/** Identifier of the toast. Calling again with an id that is still on screen reuses that toast. */
	id?: string;
};
type ToasterOptions = Omit<
	MakeRequired<
		ToasterProps,
		| 'collapseHorizontalAxis'
		| 'expand'
		| 'visibleToasts'
		| 'gap'
		| 'offset'
		| 'direction'
		| 'position'
		| 'perspectiveAmount'
	>,
	'theme'
> & {
	/** The Toaster's `theme.motion` slot, forwarded by `Toaster.svelte`. */
	motion?: ToastThemeProps['motion'];
};
const HOVER_REASON = 'hover';
const FOCUS_REASON = 'focus';
const SWIPE_REASON = 'swipe';

/** Whether `element` shows keyboard focus; engines without `:focus-visible` count every focus. */
const isFocusVisible = (element: Element | null) => {
	if (!element) return false;
	try {
		return element.matches(':focus-visible');
	} catch {
		return true;
	}
};
const HOLD_REASONS = [WINDOW_INACTIVE_REASON, HOVER_REASON, FOCUS_REASON, SWIPE_REASON];

export class Toaster extends createBindableStateClass<ToasterOptions>() {
	toasts = $state<Toast[]>([]);
	element = $state<HTMLElement>();
	/** The position whose stack the pointer is over, if any. Set with `setHovering`. */
	hovering = $state<ToastPosition | null>(null);
	/**
	 * The toast holding keyboard focus (`:focus-visible`), whose stack keeps its timers paused. A
	 * touch tap or a mouse click focuses a toast without pausing anything.
	 */
	focusedToast = $state<Toast | null>(null);
	/** Focus rests on the notification region itself, where F6 puts it; every stack is held. */
	regionFocused = $state(false);
	polygon = $state<[number, number, number, number]>([0, 0, 0, 0]);
	isOpen = $state(false);
	theme = useTheme();
	// Persistent polite and assertive regions that announce toasts: they exist before the first
	// toast and outlive every one, which live regions inserted with their text already filled in
	// do not (NVDA and JAWS often skip those). Attached to the section in `Toaster.svelte`.
	liveRegions = useLiveRegions(createId('toaster'));
	// Per-position preset from `toastTheme.motion`, through the override ladder
	// (registry → `setToastTheme` → Toaster `theme.motion` → per-toast `transition`).
	// Lives on the Toaster because `useComponentMotion` must run during init, while
	// `Toast`s are constructed later by `addToast`.
	resolveMotion = useToastMotion();

	currentPosition = $derived(
		typeof this.position === 'string'
			? this.position
			: this.theme.resolveResponsiveProps(this.position, 'bottom-right')
	);

	toastsPerPositions = $derived(
		this.toasts.reduce(
			(acc, toast) => {
				// addToast always resolves a concrete position.
				const position = toast.opts.position;
				if (!(position in acc)) {
					Object.assign(acc, {
						[position]: []
					});
				}
				acc[position as ToastPosition].push(toast);
				return acc;
			},
			{} as Record<ToastPosition, Toast[]>
		)
	);

	shouldCollapseHorizontally = $derived.by(() =>
		typeof this.collapseHorizontalAxis === 'boolean'
			? this.collapseHorizontalAxis
			: this.theme.resolveResponsiveProps(this.collapseHorizontalAxis, true)
	);

	constructor(opts: ToasterProps & Pick<ToasterOptions, 'motion'>) {
		// `Toaster.svelte` passes a live getter object that fills every option; the
		// declared prop type keeps them optional for callers.
		super(opts as ToasterOptions);
		onMount(() => {
			window.toaster = this;
			flushPendingToasts(this);
			const stopWatchingWindow = watchWindowActivity((inactive) => {
				this.windowInactive = inactive;
				this.syncHolds();
			});
			return () => {
				stopWatchingWindow();
				clearTimeout(this.announceTimer);
				this.announceTimer = undefined;
				// Don't leave a dangling reference if this Toaster unmounts (another
				// mounted Toaster may have already replaced it).
				if (window.toaster === this) window.toaster = undefined as unknown as Toaster;
			};
		});

		// Track duration configuration changes
		$effect(() => {
			const durations = this.toasts.map((toast) => ({
				toast,
				duration: toast.opts.duration || 0
			}));
			untrack(() => {
				durations.forEach(({ toast, duration }) => {
					// No timer reads as a delay of 0, so a new finite duration creates one.
					if (duration !== (toast.timer?.delay ?? 0)) {
						this.syncTimer(toast);
					}
				});
			});
		});
	}

	// Several things hold a toast's countdown at once, each under its own reason, and it runs only
	// while none does: the pointer over its stack, keyboard focus in it, a press or swipe on one of
	// its toasts, and an inactive window. Frames stop in a hidden tab while `performance.now()`
	// keeps counting, so without the window reason every pending toast would expire on the first
	// frame after the user comes back.
	private windowInactive = false;

	/** The reasons that currently hold the timers of the toasts at `position`. */
	private reasonsFor = (position: ToastPosition) => {
		const reasons: string[] = [];
		if (this.windowInactive) reasons.push(WINDOW_INACTIVE_REASON);
		if (this.hovering === position) reasons.push(HOVER_REASON);
		if (this.regionFocused || this.focusedToast?.opts.position === position) {
			reasons.push(FOCUS_REASON);
		}
		if (this.isPressed(position)) reasons.push(SWIPE_REASON);
		return reasons;
	};

	private syncToastHolds = (toast: Toast) => {
		const timer = toast.timer;
		if (!timer) return;
		const wanted = this.reasonsFor(toast.opts.position);
		for (const reason of HOLD_REASONS) {
			if (wanted.includes(reason)) timer.hold(reason);
			else timer.release(reason);
		}
	};

	/** Matches every timer's holds to the pointer, focus, swipe and window state. */
	syncHolds = () =>
		untrack(() => {
			for (const toast of this.toasts) this.syncToastHolds(toast);
		});

	/** Whether a press or a swipe is on a toast at `position`. */
	isPressed = (position: ToastPosition) =>
		this.toasts.some((toast) => toast.pressed && toast.opts.position === position);

	/** Whether a toast at `position` is being dragged; the stack stays expanded meanwhile. */
	isSwiping = (position: ToastPosition) =>
		this.toasts.some((toast) => toast.dragging && toast.opts.position === position);

	/** The pointer entered (`position`) or left (`null`) a stack. */
	setHovering = (position: ToastPosition | null) => {
		if (this.hovering === position) return;
		this.hovering = position;
		this.syncHolds();
	};

	/** Keyboard focus entered `toast` (`:focus-visible`), or left it (`null`, only if it holds it). */
	setFocused = (toast: Toast | null, from?: Toast) => {
		if (from && this.focusedToast !== from) return;
		if (this.focusedToast === toast) return;
		this.focusedToast = toast;
		this.syncHolds();
	};

	/**
	 * Matches a toast's timer to its duration. `restart` counts down the full duration again
	 * even when it did not change. A new timer starts held by whatever holds its position.
	 */
	private syncTimer = (toast: Toast, restart = false) => {
		const duration = toast.opts.duration || 0;
		if (duration <= 0) {
			// duration switched to false/0: the toast became persistent.
			toast.timer?.destroy();
			toast.timer = undefined;
			return;
		}
		if (!toast.timer) {
			// Timeout is the only path that fires onAutoDismiss (the deferred-commit hook).
			toast.timer = new Timer(() => toast.remove('auto'), duration, {
				heldBy: this.reasonsFor(toast.opts.position)
			});
			return;
		}
		if (!restart && duration === toast.timer.delay) return;
		// `update` keeps the holds; an upsert can also have moved the toast to another position,
		// whose pointer, focus and swipe state differ.
		toast.timer.update(duration);
		this.syncToastHolds(toast);
	};

	maybeCloseToaster = () => {
		if (this.toasts.length === 0) {
			this.isOpen = false;
		}
	};

	// Layers this Toaster's defaults under the options the `toast()` call supplied. Kept
	// apart from `addToast` because a toast parked before any Toaster mounted still has to
	// pick its defaults up here, from whichever Toaster ends up adopting it.
	private resolveOptions = (opts: ToastRequest): MakeRequired<ToastOptions, 'position'> => ({
		...opts,
		position: opts.position || this.currentPosition || 'bottom-right',
		size: opts.size ?? this.size,
		dismissible: opts.dismissible ?? this.dismissible,
		closeOnClick: opts.closeOnClick ?? this.closeOnClick ?? false,
		swipeToDismiss: opts.swipeToDismiss ?? this.swipeToDismiss ?? true,
		duration: opts.duration ?? this.duration,
		richColors: opts.richColors ?? this.richColors,
		showCloseIcon: opts.showCloseIcon ?? this.showCloseIcon ?? true,
		progress: opts.progress ?? this.progress ?? false
	});

	addToast = (opts: Omit<ToastOptions, 'id'> & { id?: string }) =>
		this.adoptToast(new Toast({ ...opts, id: toastId(opts) }));

	// Removed toasts whose exit transition may still be playing, by id. The list keys its
	// items by id, so a toast re-added with that id resumes the leaving item instead of
	// mounting a new one; see `adoptToast`.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping read imperatively, never rendered
	private leaving = new Map<string, Toast>();
	// Toasts re-added over a leaving one, by id, waiting for that removal to reach the DOM.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping read imperatively, never rendered
	private arriving = new Map<string, Toast>();

	/**
	 * Attaches a toast to this Toaster: resolves its options against the Toaster's
	 * defaults and pushes it onto the stack. Used both for a freshly created toast and
	 * for one parked in the pending queue while no Toaster was mounted.
	 *
	 * A toast whose id is already on screen is not added twice (the list is keyed by id):
	 * its options are merged into the live toast, its timer restarts, and the live toast is
	 * returned. A toast whose id is still animating out joins a microtask later, once that
	 * removal has reached the DOM, and takes the leaving item over.
	 */
	adoptToast = (toast: Toast) =>
		// `toast()` is often called from an effect. Reading the stack here would subscribe that
		// effect to it, and the push below would then re-run it without end.
		untrack(() => {
			const live =
				this.toasts.find((candidate) => candidate.id === toast.id) ?? this.arriving.get(toast.id);
			if (live) {
				if (live !== toast) {
					live.merge(toast.requested);
					// Shown again while already on screen: the update alone would go unnoticed.
					if (this.toasts.includes(live)) live.attentionKey += 1;
				}
				this.refreshToast(live);
				return live;
			}
			toast.toaster = this;
			toast.theme = this.theme;
			toast.opts = this.resolveOptions(toast.requested);
			const leaving = this.leaving.get(toast.id);
			if (leaving && leaving !== toast && leaving.element?.isConnected) {
				// The same id is animating out, or is about to: its removal may not have reached
				// the DOM yet. Joined in the same tick, the toast would only swap the item's value
				// in place, with no entry transition and no `onAfterOpen`. Joined once the removal
				// has flushed, Svelte resumes the leaving item and plays the entry again.
				this.arriving.set(toast.id, toast);
				tick().then(() => {
					// Dismissed before it joined.
					if (this.arriving.get(toast.id) !== toast) return;
					this.arriving.delete(toast.id);
					this.joinStack(toast);
				});
				return toast;
			}
			this.joinStack(toast);
			return toast;
		});

	/**
	 * Resolves a live toast's options against the Toaster's defaults again after they changed, and
	 * restarts its countdown. An arriving toast gets its timer when it joins the stack.
	 */
	refreshToast = (toast: Toast) =>
		untrack(() => {
			if (toast.toaster !== this) return;
			toast.opts = this.resolveOptions(toast.requested);
			if (this.toasts.includes(toast)) this.syncTimer(toast, true);
		});

	/** The toast with `id` that is on screen or about to be, never one that is leaving. */
	find = (id: string) =>
		untrack(() => this.toasts.find((toast) => toast.id === id) ?? this.arriving.get(id));

	/** Dismisses every toast on screen or about to be; each fires `onDismiss` once. */
	dismissAll = () =>
		untrack(() => {
			for (const toast of [...this.toasts, ...this.arriving.values()]) toast.remove();
		});

	private joinStack = (toast: Toast) => {
		const leaving = this.leaving.get(toast.id);
		this.leaving.delete(toast.id);
		// Svelte resumes a leaving item with this toast as its value. The component keeps its
		// element, whose one-shot `bind:this` and size bindings do not follow the new value.
		if (leaving && leaving !== toast && leaving.element?.isConnected) {
			toast.element = leaving.element;
			toast.height = leaving.height;
		}
		this.toasts.push(toast);
		this.isOpen = true;
	};

	removeToast = (toast: Toast) =>
		untrack(() => {
			if (this.arriving.get(toast.id) === toast) {
				this.arriving.delete(toast.id);
				return;
			}
			if (!this.toasts.includes(toast)) return;
			this.moveFocusFrom(toast);
			this.toasts = this.toasts.filter((t) => t !== toast);
			// Drop entries whose exit already finished so the map only holds leaving toasts.
			for (const [id, leaving] of this.leaving) {
				if (!leaving.element?.isConnected) this.leaving.delete(id);
			}
			this.leaving.set(toast.id, toast);
			// A leaving toast's timers are gone, and the hold it kept on its stack goes with it.
			if (this.focusedToast === toast) this.focusedToast = null;
			// Nothing left to hover: the pointer cannot leave a stack that is gone.
			const position = toast.opts.position;
			if (this.hovering === position && !this.toasts.some((t) => t.opts.position === position)) {
				this.hovering = null;
			}
			this.syncHolds();
		});

	// The element focused before F6 sent focus to the region; focus returns there once no toast
	// is left to hold it.
	private focusOrigin: HTMLElement | null = null;

	/**
	 * F6: moves focus into the notification region, remembering where it came from. With no toast
	 * on screen there is nothing to reach, and focus stays where it is.
	 */
	focusRegion = () => {
		const region = this.element;
		if (!region || untrack(() => this.toasts.length) === 0) return;
		const active = region.ownerDocument.activeElement;
		if (active instanceof HTMLElement && active !== region.ownerDocument.body) {
			if (!region.contains(active)) this.focusOrigin = active;
		}
		this.focusRegionElement(true);
	};

	// Set while focus is being sent to the region on behalf of a keyboard user (F6, or the toast
	// they had focused leaving): that focus holds every stack even where `:focus-visible` is unsure.
	private keyboardRegionFocus = false;

	/**
	 * Focuses the region. Only keyboard focus holds the timers: a pointer or touch user whose toast
	 * left lands on the region too, and must not leave every later toast waiting on it.
	 */
	private focusRegionElement = (keyboard: boolean) => {
		const region = this.element;
		if (!region) return;
		this.keyboardRegionFocus = keyboard;
		try {
			region.focus({ preventScroll: true });
			// Already focused: no focus event announces the keyboard user's intent.
			if (keyboard && region.ownerDocument.activeElement === region) this.holdRegion();
		} finally {
			this.keyboardRegionFocus = false;
		}
	};

	private holdRegion = () => {
		if (this.regionFocused) return;
		this.regionFocused = true;
		this.syncHolds();
	};

	/** Focus entered the region element itself: the toasts it holds wait for the user to reach them. */
	onRegionFocusIn = (event: FocusEvent) => {
		const region = this.element;
		if (event.target !== region) return;
		if (this.keyboardRegionFocus || isFocusVisible(region)) this.holdRegion();
	};

	/**
	 * Focus left the region element, or left the region and everything in it. The element F6 came
	 * from is forgotten once focus is somewhere else on its own, so it cannot pull focus back later.
	 */
	onRegionFocusOut = (event: FocusEvent) => {
		if (event.target === this.element && this.regionFocused) {
			this.regionFocused = false;
			this.syncHolds();
		}
		const next = event.relatedTarget;
		if (!(next instanceof Node) || !this.element?.contains(next)) this.focusOrigin = null;
	};

	/**
	 * Called while `toast` still holds focus and is about to leave: it was dismissed, or it is
	 * pushed past `visibleToasts` and turns inert. Focus moves to the toast nearest to it in the
	 * stack that stays visible, else back to the element F6 left, else to the region, rather than
	 * dropping to the document body.
	 */
	moveFocusFrom = (toast: Toast) => {
		const element = toast.element;
		const ownerDocument = element?.ownerDocument;
		if (
			!element ||
			!ownerDocument?.activeElement ||
			!element.contains(ownerDocument.activeElement)
		) {
			return;
		}
		const stack = this.toastsPerPositions[toast.opts.position] ?? [];
		const former = stack.indexOf(toast);
		// Read before the toast leaves: a pointer user's focus is not keyboard focus.
		const keyboard = isFocusVisible(ownerDocument.activeElement);
		tick().then(() => {
			const active = ownerDocument.activeElement;
			// Focus went somewhere else on its own in the meantime.
			if (active && active !== ownerDocument.body && !element.contains(active)) return;
			const remaining = (this.toastsPerPositions[toast.opts.position] ?? []).filter(
				(candidate) => candidate !== toast
			);
			// The newest toasts show; a candidate may only be inert until this update settles.
			const visible = remaining.slice(Math.max(0, remaining.length - this.visibleToasts));
			const order = (candidate: Toast) => Math.abs(stack.indexOf(candidate) - former);
			const next = visible
				.filter((candidate) => candidate.element?.isConnected)
				.sort((a, b) => order(a) - order(b) || stack.indexOf(b) - stack.indexOf(a))[0];
			const origin = this.focusOrigin?.isConnected ? this.focusOrigin : null;
			const target = next?.element ?? origin;
			if (target) target.focus({ preventScroll: true });
			else this.focusRegionElement(keyboard);
		});
	};

	// Toasts created in the same tick are spoken together: the live regions hold one message at a
	// time, and each announcement replaces the one before it within the same frame.
	private pendingAnnouncements: Record<'polite' | 'assertive', string[]> = {
		polite: [],
		assertive: []
	};
	private announceTimer: ReturnType<typeof setTimeout> | undefined;

	/** Announces a toast's text in the persistent live regions; `important` ones are assertive. */
	announce = (message: string, important = false) => {
		if (!message) return;
		this.pendingAnnouncements[important ? 'assertive' : 'polite'].push(message);
		if (this.announceTimer !== undefined) return;
		// A macrotask, so every toast of the burst has reached its announce call by then.
		this.announceTimer = setTimeout(() => {
			this.announceTimer = undefined;
			for (const politeness of ['polite', 'assertive'] as const) {
				const messages = this.pendingAnnouncements[politeness];
				if (!messages.length) continue;
				this.pendingAnnouncements[politeness] = [];
				this.liveRegions.announce(messages.join('. '), politeness);
			}
		}, 0);
	};
}

export class Toast {
	id: string;
	// Declared (not constructor parameter properties) so the `animations` field
	// initializer below can reference them: `$derived` only reads them on demand.
	// Both stay null until a Toaster adopts the toast — `toast()` called before
	// `<Toaster />` mounts parks the instance in `pendingToasts` first.
	toaster = $state<Toaster | null>(null);
	theme: ThemeState | null = null;
	/**
	 * The caller's own options; a Toaster layers its defaults over them on adoption. A later
	 * `toast()` call with the same id merges its options in (see `merge`).
	 */
	requested: ToastRequest;
	element = $state<HTMLElement>();
	height = $state(0);
	loading = $state(false);
	/**
	 * Counts the updates this toast received after it was created, by `toast()` with its id,
	 * `toast.update()` or `update()`. Rendered as `data-update-key`.
	 */
	updateKey = $state(0);
	/**
	 * Counts the times this toast was shown again while on screen (a `toast()` call with its id, or
	 * the same message deduplicated). Each one plays a short bounce to draw the eye back to it.
	 */
	attentionKey = $state(0);
	/** A pointer is down on the toast, or it is being swiped; its stack's timers are held. */
	pressed = $state(false);
	/** The toast is being dragged; its stack stays expanded meanwhile. */
	dragging = $state(false);
	timer = $state<Timer | undefined>(undefined);
	index = $state(0);
	opts = $state<MakeRequired<ToastOptions, 'position'>>({
		color: 'neutral',
		position: 'bottom-center',
		id: createId('toast')
	});

	// Both the constructor and `adoptToast` resolve a concrete position.
	position = $derived(this.opts.position);

	constructor(opts: ToastRequest) {
		this.requested = opts;
		this.id = opts.id;
		// Provisional until adoption resolves the Toaster's own defaults over it.
		this.opts = { ...opts, position: opts.position ?? 'bottom-right' };
		// Seed the reactive spinner flag from the initial options; callers can still
		// flip `toast.loading` later (e.g. resolve a pending action to a result).
		this.loading = opts.loading ?? false;
	}

	/**
	 * Merges the options of a later `toast()` call with this id over the ones this toast
	 * was created with; keys the call leaves out keep their value. The owning Toaster
	 * resolves its defaults over the result.
	 */
	merge = (request: Partial<ToastRequest>) => {
		this.updateKey += 1;
		this.requested = { ...this.requested, ...request, id: this.id };
		// Provisional, like the constructor's: `adoptToast` resolves the Toaster defaults.
		this.opts = { ...this.requested, position: this.requested.position ?? 'bottom-right' };
		if ('loading' in request) this.loading = request.loading ?? false;
	};

	/**
	 * Updates the toast in place: a patch, or a function that receives the current options and
	 * returns one. Keys left out keep their value, the countdown restarts from the full duration,
	 * and `data-update-key` changes. A toast that was dismissed stays dismissed: updating it, such
	 * as when a promise settles after the user closed its toast, does nothing.
	 */
	update = (patch: ToastUpdater) => {
		if (this.removed) return this;
		// Like `toast()`, often called from an effect, which must not subscribe to this toast.
		untrack(() => {
			const next = typeof patch === 'function' ? patch(this.opts) : patch;
			this.merge(next);
			this.toaster?.refreshToast(this);
		});
		return this;
	};

	/** Whether the toast was dismissed, by the user, a timeout or `remove()`. */
	get dismissed() {
		return this.removed;
	}

	// `$derived.by` (not `$derived`): `toaster` is assigned on adoption, so the
	// reference has to sit inside a function the initializer only stores. Only ever read
	// while the toast is rendered, i.e. once a Toaster owns it.
	animations = $derived.by(() => {
		const toaster = this.toaster;
		// An unadopted toast is not rendered, so this pair is never actually played.
		if (!toaster) return { in: {} as FSOParams, out: {} as FSOParams };
		return toaster.resolveMotion(
			{ position: this.opts.position },
			{ motion: toaster.motion, transition: this.opts.transition ?? toaster.transition }
		);
	});

	// Cache the last in-stack coordinates: once the toast is removed from the array
	// (outro playing), indexOf returns -1 — without the cache the leaving toast would
	// jump to a huge reversedIndex, snap to opacity 0 and skip its exit animation.
	private lastStack = { index: 0, reversedIndex: 0 };

	indexInStack = $derived.by(() => {
		const stack = this.toaster?.toastsPerPositions?.[this.opts.position] ?? [];
		const index = stack.indexOf(this);
		if (index === -1) return this.lastStack;
		return (this.lastStack = { index, reversedIndex: stack.length - (index + 1) });
	});

	hovered = $derived.by(() => this.toaster?.hovering === this.opts.position);
	// Banners stack flat (full height, no perspective scale) — the collapsed
	// perspective look doesn't suit full-width bars.
	stacked = $derived.by(() => {
		const position = this.opts.position;
		if (position === 'banner-top' || position === 'banner-bottom') return false;
		return !this.toaster?.expand && !this.hovered && !this.toaster?.isSwiping(position);
	});
	absolutePosition = $derived.by(() =>
		(this.toaster?.toastsPerPositions?.[this.position] || [])
			.toReversed()
			.reduce((acc, toast, i) => {
				if (i < this.indexInStack.reversedIndex) {
					return acc + toast.height + (this.toaster?.gap ?? 0);
				}
				return acc;
			}, 0)
	);

	// `offset` is the distance from BOTH screen edges; `gap` only spaces toasts
	// between each other (via absolutePosition) — it must not leak into the edge
	// distance, or the offset prop silently stops working vertically.
	actualizedPosition = $derived.by(() => {
		const position = this.opts.position;
		// Banners span the full width, flush to the edge (no offset, no margin).
		if (position === 'banner-top' || position === 'banner-bottom') {
			const verticalPosition = position === 'banner-top' ? 'top' : 'bottom';
			return [verticalPosition, 'center', `${verticalPosition}: 0px; left: 0px; right: 0px;`];
		}
		const [vertical, horizontal] = position.split('-');
		const verticalPosition = vertical === 'top' ? 'top' : 'bottom';
		const horizontalPosition = horizontal === 'left' ? 'left' : 'right';
		const offset = this.toaster?.offset ?? 0;
		if (horizontal === 'center') {
			return [
				verticalPosition,
				horizontalPosition,
				`${verticalPosition}: ${offset}px; left: 0px; right:0px; margin: 0 auto;`
			];
		}
		return [
			verticalPosition,
			horizontalPosition,
			`${verticalPosition}: ${offset}px; ${horizontalPosition}: ${offset}px;`
		];
	});
	translateY = $derived.by(() =>
		this.stacked
			? this.indexInStack.reversedIndex *
				(this.toaster?.perspectiveAmount ?? 0) *
				(this.actualizedPosition[0] === 'top' ? 1 : -1)
			: this.absolutePosition * (this.actualizedPosition[0] === 'top' ? 1 : -1)
	);

	private removed = false;

	// `reason` distinguishes an automatic timeout ('auto' → onAutoDismiss, the commit
	// hook) from every manual dismissal ('manual' → onDismiss). Guarded so a stray
	// event object passed as the argument (e.g. onclick={toast.remove}) still counts
	// as manual. Idempotent: an action-button click bubbles to the toast's own
	// closeOnClick handler, so remove() can fire twice — callbacks must run once.
	remove = (reason: 'manual' | 'auto' = 'manual') => {
		if (this.removed) return;
		this.removed = true;
		// Like `toast()`, often called from an effect, which must not subscribe to this toast.
		untrack(() => {
			// A toast dismissed before any Toaster mounted is still parked in the pending queue.
			// Leaving it there would have the first Toaster adopt an already-dismissed toast that
			// nothing can dismiss again, since this method is idempotent.
			dropPendingToast(this);
			this.toaster?.removeToast(this);
			this.timer?.destroy();
			if (reason === 'auto') {
				this.opts?.onAutoDismiss?.(this);
			} else {
				this.opts?.onDismiss?.(this);
			}
		});
	};
}

interface CustomEventMap {
	toast: CustomEvent<ToastOptions>;
	toast_created: CustomEvent<Toast>;
}
declare global {
	interface Window {
		toaster: Toaster;
	}
	interface Document {
		addEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Document, ev: CustomEventMap[K]) => void
		): void;
		dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
		removeEventListener<K extends keyof CustomEventMap>(
			type: K,
			listener: (this: Document, ev: CustomEventMap[K]) => void
		): void;
	}
}
type ToastCreator = {
	[key in Colors]: (t: Omit<Partial<ToastOptions>, 'color' | 'id'> & { id?: string }) => Toast;
} & {
	/**
	 * Updates the toast with `id` that is on screen: a patch, or a function of its current options.
	 * Returns the toast, or `undefined` when none with that id is on screen.
	 */
	update: (id: string, patch: ToastUpdater) => Toast | undefined;
	/** Dismisses the toast with `id`, or every toast on screen when called without one. */
	dismiss: (id?: string) => void;
	/**
	 * Shows a loading toast, then turns it into a success or error toast when `promise` settles.
	 * Returns `promise`, so it can still be awaited. A toast the user dismissed while the promise
	 * was pending is not shown again.
	 */
	promise: <Result>(
		promise: Promise<Result>,
		options: ToastPromiseOptions<Result>
	) => Promise<Result>;
};

// `toast()` can legitimately run before any `<Toaster />` has mounted — module
// initialisation, a store subscription, a navigation that fires during hydration. Those
// calls park their Toast here (in order) instead of throwing, and the first Toaster to
// mount adopts the whole queue. The caller still gets its `Toast` handle straight away.
const pendingToasts: Toast[] = [];
// The queue exists for the gap before the first Toaster mounts, not as storage: past this many
// the oldest are dropped, so a page that never mounts one cannot grow the array without bound.
const pendingToastLimit = 50;
let pendingWarningScheduled = false;

const flushPendingToasts = (toaster: Toaster) => {
	pendingWarningScheduled = false;
	if (!pendingToasts.length) return;
	for (const toast of pendingToasts.splice(0, pendingToasts.length)) toaster.adoptToast(toast);
};

/** Removes a toast dismissed while it was still waiting for a Toaster. */
const dropPendingToast = (toast: Toast) => {
	const index = pendingToasts.indexOf(toast);
	if (index !== -1) pendingToasts.splice(index, 1);
};

// A queued toast is only a problem if no Toaster ever shows up; warn once, a tick later,
// so a Toaster mounting in the same tick stays silent.
const warnIfNothingMounts = () => {
	if (pendingWarningScheduled) return;
	pendingWarningScheduled = true;
	setTimeout(() => {
		if (!pendingWarningScheduled || !pendingToasts.length) return;
		pendingWarningScheduled = false;
		console.warn(
			`entasis: ${pendingToasts.length} toast(s) are queued because no <Toaster /> is mounted. Add <Toaster /> to your root layout; they will appear as soon as one mounts.`
		);
	}, 0);
};

// The id a toast gets: the one the caller supplied, else one derived from what the toast says, so
// the same message submitted twice is one toast. A snippet title or description cannot be compared,
// so such a toast, one with no text at all, and one with `dedupe: false` are always new.
const toastId = (opts: {
	id?: string;
	color?: Colors;
	title?: Slot;
	description?: Slot;
	dedupe?: boolean;
}) => {
	if (opts.id) return opts.id;
	const { title, description } = opts;
	const comparable = (value: Slot | undefined) => value === undefined || typeof value === 'string';
	const hasText = typeof title === 'string' || typeof description === 'string';
	if (opts.dedupe === false || !hasText || !comparable(title) || !comparable(description)) {
		return createId('toast');
	}
	return `dedupe:${opts.color ?? ''}:${title ?? ''}\u0000${description ?? ''}`;
};

const createToast = (color: Colors, payload: Parameters<ToastCreator[Colors]>[0]) => {
	const toast = new Toast({
		color,
		...payload,
		id: toastId({ ...payload, color })
	});
	// On the server nothing ever mounts a Toaster, so the queue would only retain
	// toasts for the lifetime of the process. The caller still gets its handle.
	if (typeof window === 'undefined') return toast;
	// A toast whose id is already shown is updated in place (see `adoptToast`).
	if (window.toaster) return window.toaster.adoptToast(toast);
	// Same for one still queued: the first Toaster adopts a single toast per id.
	const queued = pendingToasts.find((candidate) => candidate.id === toast.id);
	if (queued) {
		queued.merge(toast.requested);
		return queued;
	}
	pendingToasts.push(toast);
	if (pendingToasts.length > pendingToastLimit) pendingToasts.shift();
	if (DEV) warnIfNothingMounts();
	return toast;
};

/** The live toast with `id`: on screen, about to join the stack, or still waiting for a Toaster. */
const findToast = (id: string) => {
	if (typeof window === 'undefined') return undefined;
	return window.toaster?.find(id) ?? pendingToasts.find((candidate) => candidate.id === id);
};

const updateToast = (id: string, patch: ToastUpdater) => findToast(id)?.update(patch);

const dismissToast = (id?: string) => {
	if (id !== undefined) {
		findToast(id)?.remove();
		return;
	}
	if (typeof window !== 'undefined') window.toaster?.dismissAll();
	for (const queued of [...pendingToasts]) queued.remove();
};

// A stage's patch starts from a clean slate so the pending toast's text and actions never leak into
// its result; the stage's own options win.
const stageUpdate = (stage: string | ToastUpdate): ToastUpdate => {
	const options = typeof stage === 'string' ? { title: stage } : stage;
	return { title: undefined, description: undefined, actions: undefined, ...options };
};

const promiseToast = <Result>(promise: Promise<Result>, options: ToastPromiseOptions<Result>) => {
	const handle = createToast('primary', {
		...stageUpdate(options.loading),
		id: options.id,
		loading: true,
		duration: false
	});
	const settle = <Value>(color: Colors, stage: ToastPromiseStage<Value>, value: Value) => {
		const resolved = typeof stage === 'function' ? stage(value) : stage;
		// `update` leaves a toast the user dismissed in the meantime alone.
		handle.update({ color, loading: false, duration: undefined, ...stageUpdate(resolved) });
	};
	promise.then(
		(result) => settle('success', options.success, result),
		(error: unknown) => settle('danger', options.error, error)
	);
	return promise;
};

export const toast = new Proxy(
	{},
	{
		get(_obj, key) {
			if (key === 'update') return updateToast;
			if (key === 'dismiss') return dismissToast;
			if (key === 'promise') return promiseToast;
			if (typeof key === 'string') {
				return (payload: Parameters<ToastCreator[Colors]>[0]) =>
					createToast(key as Colors, payload);
			}
		}
	}
) as ToastCreator;
