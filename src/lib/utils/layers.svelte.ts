// One registry for every floating surface (dialogs, popovers, menus, tooltips, windows,
// lightboxes). It decides which layer is on top, hands out z-indexes in open order, and
// dispatches Escape / outside-pointer / platform close requests to the right layer only — the
// "dismissable layer" that Radix, Bits and Ark build every overlay on.
import { on } from 'svelte/events';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { Registry } from './registry.svelte.js';
import type { OpenChangeInit, OpenChangeReason } from './openChange.js';
import { LAYER_Z_BASE, LAYER_Z_STEP } from '$lib/components/Theme/theme.layers.js';

export type LayerKind = keyof typeof LAYER_Z_BASE;
/** The open-change reasons the layer stack itself reports. */
export type DismissReason = Extract<
	OpenChangeReason,
	'escape-key' | 'outside-press' | 'close-watcher'
>;

/** A dismissal the stack asks a layer's owner to apply, in `onOpenChange` details terms. */
export interface LayerDismissRequest extends OpenChangeInit {
	reason: DismissReason;
	event: Event;
}

export interface LayerOptions {
	kind: LayerKind;
	isOpen: () => boolean;
	/** Modal layers block pointer dismissal of everything below them. */
	isModal: () => boolean;
	dismissOnEscape?: () => boolean;
	dismissOnOutside?: () => boolean;
	/**
	 * Closes the layer for `request.reason`. Return `false` when the owner's `onOpenChange`
	 * cancelled the change: the stack then leaves the originating event untouched.
	 */
	onDismiss?: (request: LayerDismissRequest) => boolean | void;
	/** Owner state, exposed to siblings that need more than the handle (e.g. the backdrop). */
	state?: unknown;
	/**
	 * The layer this one is rendered inside (a popover inside a dialog, a submenu inside a
	 * menu). Defaults to the nearest registered ancestor via context. A press inside a
	 * descendant never counts as "outside" for its ancestors.
	 */
	parent?: LayerHandle | null;
}

const LAYER_CONTEXT = Symbol('entasis:layer');

/** A registered layer, or a resolver for one that only exists while its owner is open. */
type LayerContext = LayerHandle | (() => LayerHandle | null);

/**
 * The layer the calling component renders inside, as a getter read when a layer registers.
 * Call during component initialisation.
 */
export function useParentLayer(): () => LayerHandle | null {
	const context = hasContext(LAYER_CONTEXT) ? getContext<LayerContext>(LAYER_CONTEXT) : null;
	return typeof context === 'function' ? context : () => context;
}

/**
 * Makes `resolve()` the parent layer of every layer registered below the calling component, for
 * an owner that registers its own layer later, in a child created on open (a closed Popover
 * registers none). Call during component initialisation.
 */
export function provideLayer(resolve: () => LayerHandle | null) {
	setContext(LAYER_CONTEXT, resolve);
}

/** Movement in px after which a touch on the page is a scroll, not a tap. */
const TAP_SLOP = 10;

/**
 * The current time on the clock events are stamped with (`Event.timeStamp`), so it compares with
 * the time a press began.
 */
const eventClockNow = () => new Event('entasis:now').timeStamp;

type CloseWatcherLike = EventTarget & { destroy(): void };
type CloseWatcherConstructor = new () => CloseWatcherLike;

/**
 * The platform close request (`CloseWatcher`) is used on Android only, where it is the Back
 * gesture. On desktop it would turn an Escape that an inner control stopped (without preventing)
 * into a second, unwanted close; Escape keeps its own keydown path there.
 */
const closeWatcherConstructor = (): CloseWatcherConstructor | null => {
	if (typeof window === 'undefined') return null;
	const constructor = (window as Window & { CloseWatcher?: CloseWatcherConstructor }).CloseWatcher;
	if (!constructor) return null;
	const navigatorData = navigator as Navigator & { userAgentData?: { platform?: string } };
	const android =
		navigatorData.userAgentData?.platform === 'Android' || /android/i.test(navigator.userAgent);
	return android ? constructor : null;
};

export class LayerHandle {
	readonly kind: LayerKind;
	readonly options: LayerOptions;
	readonly parent: LayerHandle | null;
	/** Global sequence assigned on every open; later opens sit above earlier ones. */
	openOrder = $state(0);
	/**
	 * When the layer last opened, on the `Event.timeStamp` clock. A press that began earlier
	 * belongs to whatever opened it and never dismisses it.
	 */
	openedAt = 0;
	/** DOM nodes that count as "inside" this layer (panel, trigger…). */
	readonly nodes = new SvelteSet<Node>();
	readonly #stack: LayerStack;

	/** Index in the open stack (bottom = 0), -1 when closed. */
	stackIndex: number;
	/** Topmost open layer of any kind. */
	isTop: boolean;
	/** Topmost open layer of its own kind (stacked dialogs scale by this). */
	isTopOfKind: boolean;
	/** How many open layers of the same kind sit above this one. */
	kindDepth: number;
	zIndex: number;

	constructor(stack: LayerStack, options: LayerOptions) {
		this.#stack = stack;
		this.kind = options.kind;
		this.options = options;
		this.parent = options.parent !== undefined ? options.parent : useParentLayer()();
		this.stackIndex = $derived(stack.open.indexOf(this));
		this.isTop = $derived(this.stackIndex >= 0 && this.stackIndex === stack.open.length - 1);
		this.isTopOfKind = $derived(this.isOpen && stack.ofKind(this.kind).at(-1) === this);
		this.kindDepth = $derived.by(() => {
			const siblings = stack.ofKind(this.kind);
			const index = siblings.indexOf(this);
			return index < 0 ? 0 : siblings.length - 1 - index;
		});
		this.zIndex = $derived(LAYER_Z_BASE[this.kind] + this.openOrder * LAYER_Z_STEP);
	}

	get isOpen() {
		return this.options.isOpen();
	}
	get isModal() {
		return this.options.isModal();
	}
	get state() {
		return this.options.state;
	}
	/** Attachment: registers a node as part of this layer for outside-pointer detection. */
	node = (node: Node) => {
		this.nodes.add(node);
		return () => {
			this.nodes.delete(node);
		};
	};

	dispose = () => {
		this.#stack.remove(this);
	};
}

export class LayerStack {
	// A plain registry rather than reactive state read, filtered and written back: see
	// `Registry`. A teardown in another async batch used to restore an old list and drop every
	// layer registered meanwhile (after a docs tab switch, dialogs opened with no backdrop and
	// ignored Escape).
	readonly #layers = new Registry<LayerHandle>();
	#seq = 0;
	/** A touch press outside non-modal layers, judged when the finger lifts. */
	#pendingTap: (() => void) | null = null;
	/** An Escape keydown whose dismissal was cancelled, until its task ends. */
	#cancelledEscape: Event | null = null;

	/** Open layers sorted bottom → top. */
	open = $derived(
		this.#layers.items.filter((layer) => layer.isOpen).sort((a, b) => a.openOrder - b.openOrder)
	);
	topModal = $derived([...this.open].reverse().find((layer) => layer.isModal));

	ofKind(kind: LayerKind) {
		return this.open.filter((layer) => layer.kind === kind);
	}

	/** The documents whose listeners are attached now, each with the function that removes them. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- imperative listener bookkeeping, written from the effect that syncs it
	readonly #listening = new Map<Document, () => void>();

	constructor() {
		// Listeners exist only while something is open. Escape goes to the top layer alone;
		// a pointer press dismisses every non-hit layer above the first layer it lands in. They
		// sit on the page's document and on the owner document of every open layer's nodes, so a
		// popup rendered into an iframe (or a portal container in another document) hears its
		// own Escape and outside presses. Documents are added and dropped as layers come and go;
		// a pending touch tap survives that, and only ends when nothing is open.
		$effect(() => {
			const documents: Document[] = [];
			if (this.open.length > 0) {
				documents.push(document);
				for (const layer of this.open) {
					for (const node of layer.nodes) {
						const owner = node.ownerDocument;
						if (owner && !documents.includes(owner)) documents.push(owner);
					}
				}
			}
			untrack(() => this.#syncDocuments(documents));
		});
		$effect(() => () => untrack(() => this.#syncDocuments([])));
	}

	#syncDocuments(documents: readonly Document[]) {
		for (const [owner, off] of this.#listening) {
			if (documents.includes(owner)) continue;
			off();
			this.#listening.delete(owner);
		}
		for (const owner of documents) {
			if (this.#listening.has(owner)) continue;
			const view = owner.defaultView;
			if (!view) continue;
			const offKey = on(view, 'keydown', this.#onKeyDown);
			const offPointer = on(owner, 'pointerdown', this.#onPointerDown, { capture: true });
			this.#listening.set(owner, () => {
				offKey();
				offPointer();
			});
		}
		if (this.#listening.size === 0) this.#pendingTap?.();
	}

	/**
	 * Registers a layer for the lifetime of the calling component. Call during component
	 * initialisation (it installs `$effect`s).
	 */
	register(options: LayerOptions): LayerHandle {
		const handle = new LayerHandle(this, options);
		setContext(LAYER_CONTEXT, handle);
		this.#layers.add(handle);
		$effect(() => {
			if (options.isOpen()) {
				untrack(() => {
					handle.openOrder = ++this.#seq;
					handle.openedAt = eventClockNow();
				});
			}
		});
		this.#watchCloseRequests(handle);
		$effect(() => () => this.remove(handle));
		return handle;
	}

	remove(handle: LayerHandle) {
		this.#layers.delete(handle);
	}

	/**
	 * One `CloseWatcher` per open modal layer that Escape could dismiss, created in open order, so
	 * the Android Back gesture closes the top layer instead of leaving the page. A watcher the
	 * browser closed while its layer stays open (a refused request it could not keep) is replaced.
	 */
	#watchCloseRequests(handle: LayerHandle) {
		let generation = $state(0);
		$effect(() => {
			void generation;
			if (!handle.isOpen || !handle.isModal || !handle.options.dismissOnEscape?.()) return;
			const CloseWatcher = untrack(closeWatcherConstructor);
			if (!CloseWatcher) return;
			const watcher = new CloseWatcher();
			const offCancel = on(watcher, 'cancel', this.#onCloseRequest);
			const offClose = on(watcher, 'close', () => {
				if (handle.isOpen) generation += 1;
			});
			return () => {
				offCancel();
				offClose();
				watcher.destroy();
			};
		});
	}

	/** The same rule as Escape: the top layer alone, and only when Escape may dismiss it. */
	#onCloseRequest = (event: Event) => {
		// Chromium turns an Escape nobody prevented into a close request after dispatch: that
		// Escape's dismissal was already refused, so it must not be asked twice.
		const refused = this.#cancelledEscape !== null;
		const top = this.open.at(-1);
		const applied =
			!refused &&
			!!top?.options.dismissOnEscape?.() &&
			top.options.onDismiss?.({
				reason: 'close-watcher',
				event,
				// The Back gesture is user input, though the event it fires carries no modality.
				interaction: 'touch',
				cancelable: event.cancelable
			}) !== false;
		// Keeps the watcher alive for the next request when nothing closed.
		if (!applied && event.cancelable) event.preventDefault();
	};

	#onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || event.defaultPrevented) return;
		const top = this.open.at(-1);
		if (!top?.options.dismissOnEscape?.()) return;
		if (top.options.onDismiss?.({ reason: 'escape-key', event }) === false) {
			// Cancelled: the keydown stays untouched for whatever handles Escape next.
			this.#cancelledEscape = event;
			setTimeout(() => {
				if (this.#cancelledEscape === event) this.#cancelledEscape = null;
			});
			return;
		}
		event.preventDefault();
	};

	#onPointerDown = (event: PointerEvent) => {
		const path = event.composedPath();
		const open = this.open;
		// A layer is "inside" the press when the press hit it or any open descendant of it.
		const protectedLayers: LayerHandle[] = [];
		for (const layer of open) {
			if (!path.some((node) => layer.nodes.has(node as Node))) continue;
			for (let current: LayerHandle | null = layer; current; current = current.parent) {
				if (!protectedLayers.includes(current)) protectedLayers.push(current);
			}
		}
		const now: LayerHandle[] = [];
		const onTap: LayerHandle[] = [];
		for (let index = open.length - 1; index >= 0; index -= 1) {
			const layer = open[index];
			// A press that began before the layer opened is the one that opened it.
			if (
				!protectedLayers.includes(layer) &&
				layer.openedAt <= event.timeStamp &&
				layer.options.dismissOnOutside?.()
			) {
				// A finger on the page may be starting a scroll: a non-modal layer (the page still
				// scrolls under it) waits to see a tap. Nothing scrolls under a modal layer.
				(event.pointerType === 'touch' && !layer.isModal ? onTap : now).push(layer);
			}
			if (layer.isModal) break; // nothing below a modal is reachable, hit or not
		}
		for (const layer of now) layer.options.onDismiss?.({ reason: 'outside-press', event });
		if (onTap.length > 0) this.#awaitTap(event, onTap);
	};

	/**
	 * Dismisses `layers` when the touch that began with `down` ends as a tap: it lifts without
	 * moving past the slop and without the browser taking it over for scrolling (`pointercancel`).
	 */
	#awaitTap(down: PointerEvent, layers: LayerHandle[]) {
		this.#pendingTap?.();
		// Capture phase, like the press itself: a control that stops propagation cannot hide it.
		// On the document the press landed in, which is not the page's inside an iframe.
		const capture = { capture: true };
		const owner = (down.currentTarget as Document | null) ?? document;
		const offs = [
			on(
				owner,
				'pointermove',
				(event) => {
					if (event.pointerId !== down.pointerId) return;
					const distance = Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY);
					if (distance > TAP_SLOP) stop();
				},
				capture
			),
			on(
				owner,
				'pointercancel',
				(event) => {
					if (event.pointerId === down.pointerId) stop();
				},
				capture
			),
			on(
				owner,
				'pointerup',
				(event) => {
					if (event.pointerId !== down.pointerId) return;
					stop();
					for (const layer of layers) {
						if (layer.isOpen) layer.options.onDismiss?.({ reason: 'outside-press', event });
					}
				},
				capture
			)
		];
		const stop = () => {
			offs.splice(0).forEach((off) => off());
			if (this.#pendingTap === stop) this.#pendingTap = null;
		};
		this.#pendingTap = stop;
	}
}
