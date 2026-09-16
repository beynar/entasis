// One registry for every floating surface (dialogs, popovers, menus, tooltips, windows,
// lightboxes). It decides which layer is on top, hands out z-indexes in open order, and
// dispatches Escape / outside-pointer dismissal to the right layer only — the
// "dismissable layer" that Radix, Bits and Ark build every overlay on.
import { on } from 'svelte/events';
import { getContext, hasContext, setContext, untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { LAYER_Z_BASE, LAYER_Z_STEP } from '$lib/components/Theme/theme.layers.js';

export type LayerKind = keyof typeof LAYER_Z_BASE;
export type DismissReason = 'escape' | 'outside';

export interface LayerOptions {
	kind: LayerKind;
	isOpen: () => boolean;
	/** Modal layers block pointer dismissal of everything below them. */
	isModal: () => boolean;
	dismissOnEscape?: () => boolean;
	dismissOnOutside?: () => boolean;
	onDismiss?: (reason: DismissReason) => void;
	/** Owner state, exposed to siblings that need more than the handle (e.g. the backdrop). */
	state?: unknown;
	/**
	 * The layer this one is rendered inside (a popover inside a dialog, a submenu inside a
	 * menu). Defaults to the nearest registered ancestor via context. A press inside a
	 * descendant never counts as "outside" for its ancestors.
	 */
	parent?: LayerHandle | null;
}

const LAYER_CONTEXT = Symbol('svelai:layer');

export class LayerHandle {
	readonly kind: LayerKind;
	readonly options: LayerOptions;
	readonly parent: LayerHandle | null;
	/** Global sequence assigned on every open; later opens sit above earlier ones. */
	openOrder = $state(0);
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
		this.parent =
			options.parent !== undefined
				? options.parent
				: hasContext(LAYER_CONTEXT)
					? getContext<LayerHandle>(LAYER_CONTEXT)
					: null;
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
	// Raw (non-proxied) and replaced immutably on every change: handles are class instances
	// with their own signals, and pushing them through a deep `$state` proxy was observed to
	// desync the proxy's length from its entries once layers unmount in bulk (entries read
	// back as `undefined`), which broke every overlay opened afterwards.
	#layers = $state.raw<LayerHandle[]>([]);
	#seq = 0;

	/** Open layers sorted bottom → top. */
	open = $derived(
		this.#layers.filter((layer) => layer.isOpen).sort((a, b) => a.openOrder - b.openOrder)
	);
	topModal = $derived([...this.open].reverse().find((layer) => layer.isModal));

	ofKind(kind: LayerKind) {
		return this.open.filter((layer) => layer.kind === kind);
	}

	constructor() {
		// Listeners exist only while something is open. Escape goes to the top layer alone;
		// a pointer press dismisses every non-hit layer above the first layer it lands in.
		$effect(() => {
			if (this.open.length === 0) return;
			const offKey = on(window, 'keydown', this.#onKeyDown);
			const offPointer = on(document, 'pointerdown', this.#onPointerDown, { capture: true });
			return () => {
				offKey();
				offPointer();
			};
		});
	}

	/**
	 * Registers a layer for the lifetime of the calling component. Call during component
	 * initialisation (it installs an `$effect`).
	 */
	register(options: LayerOptions): LayerHandle {
		const handle = new LayerHandle(this, options);
		setContext(LAYER_CONTEXT, handle);
		this.#layers = [...this.#layers, handle];
		$effect(() => {
			if (options.isOpen()) {
				untrack(() => {
					handle.openOrder = ++this.#seq;
				});
			}
		});
		$effect(() => () => this.remove(handle));
		return handle;
	}

	remove(handle: LayerHandle) {
		this.#layers = this.#layers.filter((layer) => layer !== handle);
	}

	#onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape' || event.defaultPrevented) return;
		const top = this.open.at(-1);
		if (!top?.options.dismissOnEscape?.()) return;
		event.preventDefault();
		top.options.onDismiss?.('escape');
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
		for (let index = open.length - 1; index >= 0; index -= 1) {
			const layer = open[index];
			if (!protectedLayers.includes(layer) && layer.options.dismissOnOutside?.()) {
				layer.options.onDismiss?.('outside');
			}
			if (layer.isModal) return; // nothing below a modal is reachable, hit or not
		}
	};
}
