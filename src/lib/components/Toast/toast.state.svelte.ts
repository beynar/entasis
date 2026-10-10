import { ThemeState, useTheme } from '../Theme/theme.state.svelte.js';
import { Timer } from '$lib/utils/timer.svelte.js';
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

type ToastOptions = {
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
	/** Text and layout direction. */
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
export class Toaster extends createBindableStateClass<ToasterOptions>() {
	toasts = $state<Toast[]>([]);
	element = $state<HTMLElement>();
	hovering = $state<ToastPosition | null>(null);
	polygon = $state<[number, number, number, number]>([0, 0, 0, 0]);
	isOpen = $state(false);
	theme = useTheme();
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
			const stopWatchingWindow = this.watchWindowActivity();
			return () => {
				stopWatchingWindow();
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

	// Timers stop while the window is blurred or its tab hidden. Frames stop in a hidden tab
	// while `performance.now()` keeps counting, so without this every pending toast would
	// expire on the first frame after the user comes back.
	private windowBlurred = false;
	private documentHidden = false;

	private get windowInactive() {
		return this.windowBlurred || this.documentHidden;
	}

	/** Whether timers at `position` must stay paused: hovered, or the window is inactive. */
	private shouldPause = (position: ToastPosition) =>
		this.windowInactive || this.hovering === position;

	private watchWindowActivity = () => {
		this.documentHidden = document.visibilityState === 'hidden';
		const update = (change: () => void) => {
			const wasInactive = this.windowInactive;
			change();
			if (wasInactive === this.windowInactive) return;
			this.toasts.forEach((toast) => {
				if (this.shouldPause(toast.opts.position)) toast.timer?.pause();
				else toast.timer?.resume();
			});
		};
		// Blur and focus don't bubble, so these listeners only see the window's own events; the
		// target check keeps element focus changes out all the same.
		const onBlur = (event: FocusEvent) => {
			if (event.target === event.currentTarget) update(() => (this.windowBlurred = true));
		};
		const onFocus = (event: FocusEvent) => {
			if (event.target === event.currentTarget) update(() => (this.windowBlurred = false));
		};
		const onVisibilityChange = () =>
			update(() => (this.documentHidden = document.visibilityState === 'hidden'));
		window.addEventListener('blur', onBlur);
		window.addEventListener('focus', onFocus);
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			window.removeEventListener('blur', onBlur);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	};

	/**
	 * Matches a toast's timer to its duration. `restart` counts down the full duration again
	 * even when it did not change. A new or restarted timer starts paused when the toast's
	 * position is hovered or the window is inactive.
	 */
	private syncTimer = (toast: Toast, restart = false) => {
		const duration = toast.opts.duration || 0;
		if (duration <= 0) {
			// duration switched to false/0: the toast became persistent.
			toast.timer?.destroy();
			toast.timer = undefined;
			return;
		}
		const paused = this.shouldPause(toast.opts.position);
		if (!toast.timer) {
			// Timeout is the only path that fires onAutoDismiss (the deferred-commit hook).
			toast.timer = new Timer(() => toast.remove('auto'), duration, { startPaused: paused });
			return;
		}
		if (!restart && duration === toast.timer.delay) return;
		toast.timer.update(duration);
		// An upsert can move the toast to another position, whose hover state differs.
		if (paused) toast.timer.pause();
		else toast.timer.resume();
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
		this.adoptToast(new Toast({ ...opts, id: opts.id || createId('toast') }));

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
				if (live !== toast) live.merge(toast.requested);
				live.opts = this.resolveOptions(live.requested);
				// An arriving toast gets its timer when it joins the stack.
				if (this.toasts.includes(live)) this.syncTimer(live, true);
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
			this.toasts = this.toasts.filter((t) => t !== toast);
			// Drop entries whose exit already finished so the map only holds leaving toasts.
			for (const [id, leaving] of this.leaving) {
				if (!leaving.element?.isConnected) this.leaving.delete(id);
			}
			this.leaving.set(toast.id, toast);
		});

	toggleTimers = (position: ToastPosition, mode: 'pause' | 'resume') => {
		// Leaving the hovered stack must not restart timers in an inactive window.
		if (mode === 'resume' && this.windowInactive) return;
		this.toasts.forEach((toast) => {
			if (toast.opts.position === position) {
				toast.timer?.[mode]?.();
			}
		});
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
	merge = (request: ToastRequest) => {
		this.requested = { ...this.requested, ...request, id: this.id };
		// Provisional, like the constructor's: `adoptToast` resolves the Toaster defaults.
		this.opts = { ...this.requested, position: this.requested.position ?? 'bottom-right' };
		if ('loading' in request) this.loading = request.loading ?? false;
	};

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
		return !this.toaster?.expand && !this.hovered;
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

export const toast = new Proxy(
	{},
	{
		get(_obj, key) {
			if (typeof key === 'string') {
				return (payload: Parameters<ToastCreator[Colors]>[0]) => {
					const toast = new Toast({
						color: key as Colors,
						...payload,
						id: payload?.id || createId('toast')
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
			}
		}
	}
) as ToastCreator;
