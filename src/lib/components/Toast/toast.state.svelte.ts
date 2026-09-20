import { ThemeState, useTheme } from '../Theme/theme.state.svelte.js';
import { Timer } from '$lib/utils/timer.svelte.js';
import { DEV } from 'esm-env';
import { onMount, untrack } from 'svelte';
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
			return () => {
				// Don't leave a dangling reference if this Toaster unmounts (another
				// mounted Toaster may have already replaced it).
				if (window.toaster === this) window.toaster = undefined as unknown as Toaster;
			};
		});

		// Track duration configuration changes
		$effect(() => {
			const timersAndDurations = this.toasts.map((toast) => {
				return {
					toast,
					position: toast.opts.position,
					duration: toast.opts.duration || 0,
					// Timeout is the only path that fires onAutoDismiss (the deferred-commit hook).
					callback: () => toast.remove('auto')
				};
			});
			untrack(() => {
				timersAndDurations.forEach(({ toast, position, duration, callback }) => {
					if (!toast.timer && duration > 0) {
						toast.timer = new Timer(callback, duration);
						if (this.hovering === position) {
							toast.timer.pause();
						}
					} else if (duration !== toast.timer?.delay && duration > 0 && toast.timer) {
						toast.timer.update(duration);
					} else if (toast.timer && duration <= 0) {
						// duration switched to false/0: the toast became persistent.
						toast.timer.destroy();
						toast.timer = undefined;
					}
				});
			});
		});
	}

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

	/**
	 * Attaches a toast to this Toaster: resolves its options against the Toaster's
	 * defaults and pushes it onto the stack. Used both for a freshly created toast and
	 * for one parked in the pending queue while no Toaster was mounted.
	 */
	adoptToast = (toast: Toast) => {
		toast.toaster = this;
		toast.theme = this.theme;
		toast.opts = this.resolveOptions(toast.requested);
		this.toasts.push(toast);
		this.isOpen = true;
		return toast;
	};

	removeToast = (toast: Toast) => {
		this.toasts = this.toasts.filter((t) => t.id !== toast.id);
	};

	toggleTimers = (position: ToastPosition, mode: 'pause' | 'resume') => {
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
	/** The caller's own options; a Toaster layers its defaults over them on adoption. */
	readonly requested: ToastRequest;
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
					if (window.toaster) return window.toaster.adoptToast(toast);
					pendingToasts.push(toast);
					if (pendingToasts.length > pendingToastLimit) pendingToasts.shift();
					if (DEV) warnIfNothingMounts();
					return toast;
				};
			}
		}
	}
) as ToastCreator;
