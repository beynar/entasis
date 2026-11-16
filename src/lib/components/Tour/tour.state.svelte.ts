// The Tour's behaviour: open state and the current step, the pipeline that resolves a step
// (`before`, waiting for the target, scrolling it into view) before it shows, the spotlight that
// follows its target, and what the page around it owes assistive technology (the target's
// description, `inert` in modal mode, the announcement, focus coming back).
//
// Layering: the tour registers one layer (kind `popover`) that is modal for the layer stack, so a
// press on its popup never dismisses a Dialog the target sits in. The popup is one Popover rendered
// inside that layer, so it opens above the backdrop; from one step to the next it glides to the new
// target while a Stepper inside it slides from one step's content to the next. When another layer
// opened above the tour (a Dialog a step's `before` opened), the tour's layer is raised and a
// fresh popup opens, keeping the backdrop above that layer and the popup above the backdrop.
import { tick, untrack } from 'svelte';
import { on } from 'svelte/events';
import { autoUpdate, getOverflowAncestors, type VirtualElement } from '@floating-ui/dom';
import { useTheme } from '../Theme/theme.state.svelte.js';
import { useOpenLifecycle } from '$lib/utils/openLifecycle.svelte.js';
import { useLiveRegions } from '$lib/utils/useLiveAnnouncer.svelte.js';
import { useDirection } from '$lib/utils/useDirection.svelte.js';
import { easingBezierStrings, easingFunctions } from '$lib/transitions/easingFunctions.js';
import {
	composedContains,
	getDeepActiveElement,
	getTabbableElements,
	isFocusable,
	isTabbable,
	isTextField
} from '$lib/utils/focus.js';
import { findFocusFallback, installFocusHistory } from '$lib/utils/focusHistory.js';
import {
	getInteractionType,
	requestOpenChange,
	resolveOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeHandler,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import type { LayerHandle } from '$lib/utils/layers.svelte.js';
import type { ResolvedMotion } from '$lib/utils/motion/index.js';
import type { TourApi, TourNavigationInput, TourStatus } from './tour.api.js';
import type {
	TourMissingTarget,
	TourStep,
	TourStepChangeDetails,
	TourStepChangeReason
} from './tour.props.js';
import {
	interpolateSpotlight,
	sameSpotlight,
	spotlightFor,
	type TourRect,
	type TourSpotlight
} from './tour.geometry.js';
import { waitForTarget } from './tour.targets.svelte.js';

/** Longest wait for a smooth scroll to settle before the step shows anyway. */
const SCROLL_SETTLE_TIMEOUT = 1000;
/** Animation frames the target must keep still for a scroll to count as finished. */
const SCROLL_STILL_FRAMES = 4;

/** What the Tour component hands its state: its props, read when they are needed. */
export interface TourOptions {
	readonly id: string;
	readonly steps: TourStep[];
	isOpen: boolean;
	step: number;
	readonly onOpenChange: OpenChangeHandler | undefined;
	readonly onAfterOpen: ((tour: TourApi) => void) | undefined;
	readonly onAfterClose: ((tour: TourApi) => void) | undefined;
	readonly onStepChange: ((details: TourStepChangeDetails) => void) | undefined;
	readonly modal: boolean;
	readonly padding: number;
	readonly radius: number | 'auto';
	readonly missingTarget: TourMissingTarget;
	readonly targetTimeout: number;
	readonly closeOnEscape: boolean;
	readonly closeOnBackdropPress: boolean;
	readonly keyboardNavigation: boolean;
	readonly scrollIntoView: boolean;
	readonly motion: () => { backdrop: ResolvedMotion; spotlight: ResolvedMotion };
}

/**
 * The step popup. One Popover carries the steps from one to the next: `index` and `target` move
 * on. A fresh one opens when the tour opens, and when a layer opened above the tour.
 */
export interface TourPopup {
	readonly key: number;
	index: number;
	target: HTMLElement | null;
	open: boolean;
	/** The popup's `<dialog>`, once mounted. */
	root: HTMLElement | null;
}

const createStepDetails = (init: {
	step: number;
	reason: TourStepChangeReason;
	from: number;
	event?: Event;
}): TourStepChangeDetails => {
	let canceled = false;
	return {
		step: init.step,
		reason: init.reason,
		from: init.from,
		event: init.event,
		interaction: getInteractionType(init.event),
		cancel() {
			canceled = true;
		},
		get isCanceled() {
			return canceled;
		}
	};
};

const eventOf = (input: TourNavigationInput): Event | undefined => {
	if (!input) return undefined;
	return typeof Event !== 'undefined' && input instanceof Event
		? input
		: (input as { event?: Event }).event;
};

/** A box from a DOMRect-like value. */
const toRect = (rect: { left: number; top: number; width: number; height: number }): TourRect => ({
	x: rect.left,
	y: rect.top,
	width: rect.width,
	height: rect.height
});

/** The corner radius of `element` in px, a percentage resolved against its shorter side. */
const cornerRadius = (element: HTMLElement, rect: TourRect) => {
	const value = getComputedStyle(element).borderTopLeftRadius.split(' ')[0] ?? '0';
	const number = parseFloat(value);
	if (!Number.isFinite(number)) return 0;
	return value.endsWith('%') ? (number / 100) * Math.min(rect.width, rect.height) : number;
};

/** The visible boxes of the elements that scroll or clip `element`, with the viewport last. */
const clipsOf = (element: HTMLElement, viewport: { width: number; height: number }) => {
	const clips: TourRect[] = [];
	const doc = element.ownerDocument;
	for (const ancestor of getOverflowAncestors(element)) {
		if (!(ancestor instanceof Element)) continue;
		if (ancestor === doc.documentElement || ancestor === doc.body) continue;
		const box = ancestor.getBoundingClientRect();
		clips.push({
			x: box.left + ancestor.clientLeft,
			y: box.top + ancestor.clientTop,
			width: ancestor.clientWidth,
			height: ancestor.clientHeight
		});
	}
	clips.push({ x: 0, y: 0, width: viewport.width, height: viewport.height });
	return clips;
};

/** Adds or removes `id` in a space-separated attribute (`aria-describedby`). */
const editTokens = (element: Element, name: string, id: string, add: boolean) => {
	const tokens = (element.getAttribute(name) ?? '').split(/\s+/).filter(Boolean);
	const next = add ? [...new Set([...tokens, id])] : tokens.filter((token) => token !== id);
	if (next.length > 0) element.setAttribute(name, next.join(' '));
	else element.removeAttribute(name);
};

/**
 * Marks everything outside `keep` (and their ancestors) `inert`, skipping elements that already
 * are, and returns the function that releases exactly what it marked: an `inert` the page set
 * itself, on the target or around it, is never removed.
 */
const inertOutside = (keep: readonly Element[]): (() => void) => {
	const kept = keep.filter((element) => element.isConnected);
	if (kept.length === 0) return () => {};
	const doc = kept[0].ownerDocument;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a one-off walk, never rendered
	const branch = new Set<Element>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a one-off walk, never rendered
	const parents = new Set<Element>();
	for (const element of kept) {
		branch.add(element);
		for (let parent = element.parentElement; parent; parent = parent.parentElement) {
			branch.add(parent);
			parents.add(parent);
			if (parent === doc.body) break;
		}
	}
	const marked: Element[] = [];
	for (const parent of parents) {
		if (parent === doc.documentElement) continue;
		for (const child of parent.children) {
			if (branch.has(child) || child.hasAttribute('inert')) continue;
			if (child.hasAttribute('data-live-region')) continue;
			if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
			child.setAttribute('inert', '');
			marked.push(child);
		}
	}
	return () => {
		for (const element of marked.splice(0)) element.removeAttribute('inert');
	};
};

export class TourState {
	readonly options: TourOptions;
	readonly theme = useTheme();
	readonly layer: LayerHandle;
	readonly lifecycle;
	readonly live;
	readonly api: TourApi;

	/** Step popups: the current one, and earlier ones still playing their exit. */
	popups = $state<TourPopup[]>([]);
	status = $state<TourStatus>('idle');
	/** The element the current step points at, while it shows. */
	target = $state<HTMLElement | null>(null);
	/** The spotlight as drawn right now (mid-glide included). */
	spotlight = $state.raw<TourSpotlight | null>(null);
	/** The viewport the backdrop covers. */
	viewport = $state({ width: 0, height: 0 });
	/** Whether the last spotlight move followed a scroll or resize rather than a step change. */
	instant = $state(false);
	/** The backdrop root, while mounted. */
	root = $state<HTMLElement | null>(null);
	/** Bumped to raise the tour's layer above one that opened after it. */
	#raise = $state(0);

	#popupKey = 0;
	/** The step the pipeline is showing or resolving; a different `step` prop starts it again. */
	#requested = -1;
	/** Which way the tour is going, for `missingTarget: 'skip'`. */
	#direction: 1 | -1 = 1;
	/** Each resolution gets a number; one that finishes after a newer one started is dropped. */
	#generation = 0;
	#abort: AbortController | null = null;
	/** Undo functions for what the shown step did to the page. */
	#stepCleanups: Array<() => void> = [];
	#releaseInert: () => void = () => {};
	/** Where focus was when the tour opened. */
	#returnFocus: HTMLElement | null = null;
	#lastClose: OpenChangeDetails | null = null;
	/** Whether the tour started (and has something to undo when it stops). */
	#running = false;
	/** Whether a step has shown since the tour opened: the first one does not glide in. */
	#presented = false;
	#destination: TourSpotlight | null = null;
	#glide: { from: TourSpotlight | null; start: number; frame: number } | null = null;
	#readingDirection: () => 'ltr' | 'rtl';

	constructor(options: TourOptions) {
		this.options = options;
		this.layer = this.theme.layers.register({
			kind: 'popover',
			isOpen: () => {
				void this.#raise;
				return this.options.isOpen;
			},
			// Modal for the layer stack: a press on the tour (its popup, its backdrop) never reaches
			// the layers beneath it, such as the Dialog its target sits in.
			isModal: () => true,
			dismissOnEscape: () => this.options.closeOnEscape,
			dismissOnOutside: () => false,
			onDismiss: (request) => this.close(request),
			state: this
		});
		this.lifecycle = useOpenLifecycle({
			isOpen: () => this.options.isOpen,
			onAfterOpen: () => this.options.onAfterOpen?.(this.api),
			onAfterClose: () => this.options.onAfterClose?.(this.api)
		});
		this.live = useLiveRegions(options.id, 'tour');
		this.#readingDirection = useDirection(() => this.currentPopup?.root ?? this.root);
		this.api = this.#createApi();

		// Opening starts at the current step; closing undoes everything the tour did to the page.
		$effect(() => {
			const open = this.options.isOpen;
			untrack(() => {
				if (open) this.#start();
				else this.#stop();
			});
		});
		// A `step` the parent moved while the tour runs shows that step (silently: the parent made
		// the change, so `onStepChange` is not asked).
		$effect(() => {
			const step = this.options.step;
			if (!this.options.isOpen) return;
			untrack(() => {
				if (step === this.#requested || this.#requested < 0) return;
				this.#show(this.#clamp(step), step >= this.#requested ? 1 : -1);
			});
		});
		$effect(() => {
			if (!this.options.isOpen) return;
			const doc = document;
			const measureViewport = () => {
				const element = doc.documentElement;
				this.viewport = { width: element.clientWidth, height: element.clientHeight };
			};
			measureViewport();
			const offs = [
				installFocusHistory(doc),
				on(window, 'resize', () => {
					measureViewport();
					this.#measure(true);
				}),
				on(doc, 'keydown', this.#onKeyDown)
			];
			return () => offs.forEach((off) => off());
		});
		$effect(() => () => untrack(() => this.#stop()));
	}

	get steps() {
		return this.options.steps;
	}
	get isOpen() {
		return this.options.isOpen;
	}
	get step() {
		return this.#clamp(this.options.step);
	}
	get total() {
		return this.steps.length;
	}
	get current(): TourStep | undefined {
		return this.steps[this.step];
	}
	/** The popup of the step on show, or `null` while none is. */
	get currentPopup(): TourPopup | null {
		const last = this.popups.at(-1);
		return last && last.open ? last : null;
	}

	// Per step as well as per popup: while the content crossfades, the leaving step keeps its ids.
	titleId = (popup: TourPopup, index = popup.index) =>
		`${this.options.id}-title-${popup.key}-${index}`;
	descriptionId = (popup: TourPopup, index = popup.index) =>
		`${this.options.id}-description-${popup.key}-${index}`;
	/** Whether a step has something to describe it with. */
	hasDescription = (index: number) => {
		const step = this.steps[index];
		return !!(step?.description || step?.content);
	};

	#clamp(index: number) {
		const last = this.steps.length - 1;
		if (last < 0) return 0;
		return Math.min(Math.max(Math.trunc(Number.isFinite(index) ? index : 0), 0), last);
	}

	#createApi(): TourApi {
		// eslint-disable-next-line @typescript-eslint/no-this-alias -- getters below read the state
		const state = this;
		return {
			get isOpen() {
				return state.isOpen;
			},
			get status() {
				return state.status;
			},
			get step() {
				return state.step;
			},
			get total() {
				return state.total;
			},
			get current() {
				return state.current;
			},
			get target() {
				return state.target;
			},
			get isFirst() {
				return state.step === 0;
			},
			get isLast() {
				return state.step >= state.total - 1;
			},
			get titleId() {
				const popup = state.currentPopup;
				return popup ? state.titleId(popup) : `${state.options.id}-title`;
			},
			get descriptionId() {
				const popup = state.currentPopup;
				return popup ? state.descriptionId(popup) : `${state.options.id}-description`;
			},
			next: (input) => state.next(input),
			previous: (input) => state.previous(input),
			goTo: (index, input) => state.goTo(index, input),
			close: (input) => state.close(input)
		};
	}

	// --- Open state -------------------------------------------------------------------------------

	/** Requests closing with `details`; returns `false` when `onOpenChange` cancelled it. */
	close = (input?: OpenChangeDetails | OpenChangeInit | Event): boolean => {
		if (!this.options.isOpen) return false;
		const details = resolveOpenChangeDetails(input, { reason: 'imperative-action' });
		if (!requestOpenChange(this.options.onOpenChange, false, details)) return false;
		this.#lastClose = details;
		this.options.isOpen = false;
		return true;
	};

	#start() {
		if (this.steps.length === 0) {
			this.options.isOpen = false;
			return;
		}
		const active = getDeepActiveElement(document);
		this.#returnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
		this.#lastClose = null;
		this.#running = true;
		this.#presented = false;
		const index = this.#clamp(this.options.step);
		this.#show(index, 1);
	}

	#stop() {
		if (!this.#running) return;
		this.#running = false;
		this.#abort?.abort();
		this.#abort = null;
		this.#generation += 1;
		this.#requested = -1;
		const focusWasInside = this.#focusInTour();
		this.#leaveStep();
		for (const popup of this.popups) popup.open = false;
		this.#cancelGlide();
		clearTimeout(this.#glideTimer);
		this.#destination = null;
		this.spotlight = null;
		this.target = null;
		this.status = 'idle';
		this.live.reset();
		if (focusWasInside) this.#restoreFocus();
		this.#returnFocus = null;
	}

	/** Whether focus is in a tour popup, or nowhere (on `<body>`). */
	#focusInTour() {
		if (typeof document === 'undefined') return false;
		const active = getDeepActiveElement(document);
		if (!active || active === document.body) return true;
		return this.popups.some((popup) => !!popup.root && composedContains(popup.root, active));
	}

	#restoreFocus() {
		const details = this.#lastClose;
		const visible = details?.reason === 'escape-key' || details?.interaction === 'keyboard';
		const usable = (element: HTMLElement | null): element is HTMLElement =>
			!!element && element.isConnected && !element.closest('[inert]') && isFocusable(element);
		const target = usable(this.#returnFocus)
			? this.#returnFocus
			: findFocusFallback(document, {
					accept: (element) =>
						!this.popups.some((popup) => !!popup.root && composedContains(popup.root, element))
				});
		target?.focus({
			preventScroll: true,
			...(visible ? { focusVisible: true } : {})
		} as FocusOptions);
	}

	// --- Steps ------------------------------------------------------------------------------------

	next = (input?: TourNavigationInput) => this.#advance('imperative-action', input);
	previous = (input?: TourNavigationInput) =>
		this.#navigate(this.step - 1, 'imperative-action', input);
	goTo = (index: number, input?: TourNavigationInput) =>
		this.#navigate(index, 'imperative-action', input);

	/** The Next button and `advanceOn`: the next step, or completing the tour on the last one. */
	#advance(reason: TourStepChangeReason, input?: TourNavigationInput) {
		if (!this.options.isOpen) return false;
		if (this.step >= this.total - 1) {
			return this.close({ reason: 'complete', event: eventOf(input) });
		}
		return this.#navigate(this.step + 1, reason, input);
	}

	pressNext = (event: Event) => this.#advance('next-press', event);
	pressPrevious = (event: Event) => this.#navigate(this.step - 1, 'previous-press', event);
	pressSkip = (event: Event) => this.close({ reason: 'skip-press', event });
	pressClose = (event: Event) => this.close({ reason: 'close-press', event });
	pressBackdrop = (event: Event) => {
		if (this.options.closeOnBackdropPress) this.close({ reason: 'outside-press', event });
	};

	#navigate(index: number, reason: TourStepChangeReason, input?: TourNavigationInput): boolean {
		if (!this.options.isOpen || index < 0 || index >= this.total) return false;
		const from = this.step;
		const details = createStepDetails({ step: index, reason, from, event: eventOf(input) });
		this.options.onStepChange?.(details);
		if (details.isCanceled) return false;
		this.#show(index, index >= from ? 1 : -1);
		return true;
	}

	/**
	 * Resolves and shows step `index`: runs `before`, waits for the target, applies
	 * `missingTarget`, scrolls the target into view, then presents it. A newer request (or closing)
	 * aborts this one.
	 */
	async #show(index: number, direction: 1 | -1) {
		this.#abort?.abort();
		const abort = new AbortController();
		this.#abort = abort;
		const generation = ++this.#generation;
		const stale = () => generation !== this.#generation || !this.options.isOpen;
		this.#requested = index;
		this.#direction = direction;
		if (this.options.step !== index) this.options.step = index;
		this.status = 'resolving';

		const step = this.steps[index];
		if (!step) return;
		let failed = false;
		try {
			await step.before?.({ signal: abort.signal, step: index, direction });
		} catch (error) {
			if (stale()) return;
			failed = true;
			console.error(error);
		}
		if (stale()) return;

		let target: HTMLElement | null = null;
		if (step.target != null && !failed) {
			target = await waitForTarget(step.target, {
				timeout: this.options.targetTimeout,
				signal: abort.signal
			});
			if (stale()) return;
		}
		if (step.target != null && !target) {
			const policy = step.missingTarget ?? this.options.missingTarget;
			if (policy === 'stop') {
				if (this.close({ reason: 'target-missing' })) return;
			} else if (policy === 'skip') {
				const next = index + direction;
				if (next < 0 || next >= this.total) {
					if (this.close({ reason: 'target-missing' })) return;
				} else {
					const details = createStepDetails({
						step: next,
						reason: 'target-missing',
						from: index
					});
					this.options.onStepChange?.(details);
					if (!details.isCanceled) {
						void this.#show(next, direction);
						return;
					}
				}
			}
			// `center`, or a skip or stop that was cancelled: the step shows centred.
		}

		if (target && this.options.scrollIntoView) {
			await this.#scrollIntoView(target, abort.signal);
			if (stale()) return;
		}
		await this.#present(index, target, generation);
	}

	/** Scrolls `target` into view when part of it is hidden, and waits for the scroll to end. */
	async #scrollIntoView(target: HTMLElement, signal: AbortSignal) {
		const rect = toRect(target.getBoundingClientRect());
		const element = document.documentElement;
		const visible = spotlightFor(rect, {
			padding: 0,
			radius: 0,
			targetRadius: 0,
			clips: clipsOf(target, { width: element.clientWidth, height: element.clientHeight })
		});
		const fully =
			visible &&
			Math.abs(visible.width - rect.width) < 1 &&
			Math.abs(visible.height - rect.height) < 1;
		if (fully) return;
		const reduced = this.theme.preferReducesMotion;
		target.scrollIntoView({
			block: 'nearest',
			inline: 'nearest',
			behavior: reduced ? 'instant' : 'smooth'
		});
		if (reduced) return;
		await new Promise<void>((resolve) => {
			let last = '';
			let still = 0;
			let frame = 0;
			const finish = () => {
				cancelAnimationFrame(frame);
				clearTimeout(timer);
				off();
				signal.removeEventListener('abort', finish);
				resolve();
			};
			// `scrollend` does not bubble: the capture phase hears it from any scroller.
			const off = on(document, 'scrollend', finish, { capture: true });
			const timer = setTimeout(finish, SCROLL_SETTLE_TIMEOUT);
			signal.addEventListener('abort', finish);
			const poll = () => {
				const box = target.getBoundingClientRect();
				const key = `${box.left},${box.top}`;
				still = key === last ? still + 1 : 0;
				last = key;
				if (still >= SCROLL_STILL_FRAMES) finish();
				else frame = requestAnimationFrame(poll);
			};
			frame = requestAnimationFrame(poll);
		});
	}

	/** Shows step `index` on `target` (`null`: centred): popup, spotlight, page wiring. */
	async #present(index: number, target: HTMLElement | null, generation: number) {
		const first = !this.#presented;
		this.#leaveStep();
		// A layer that opened above the tour (a Dialog `before` opened) would cover the backdrop and
		// the popup: raise the tour first, then open a fresh popup above it. Otherwise the popup on
		// show moves on to this step.
		const layerAbove = this.#layerAbove();
		const moving = first || layerAbove ? null : this.currentPopup;
		for (const popup of this.popups) if (popup !== moving) popup.open = false;

		if (layerAbove) {
			this.#raise += 1;
			await tick();
			if (generation !== this.#generation || !this.options.isOpen) return;
		}

		this.target = target;
		this.status = 'ready';
		this.#presented = true;
		let popup: TourPopup;
		let refocus = false;
		if (moving) {
			popup = moving;
			refocus = this.#focusIn(popup);
			this.#glidePopup(popup);
			popup.index = index;
			popup.target = target;
		} else {
			const fresh: TourPopup = $state({
				key: ++this.#popupKey,
				index,
				target,
				open: true,
				root: null
			});
			popup = fresh;
			this.popups.push(popup);
		}

		// The spotlight glides there, except onto the first step, which fades in with the backdrop.
		this.#measure(false, !first);
		if (target) this.#enterTarget(target, popup, index);

		const step = this.steps[index];
		if (step) {
			this.live.announce(this.#announcement(index, step.title));
		}

		await tick();
		if (generation !== this.#generation || !this.options.isOpen) return;
		// The control that had focus left with the previous step's panel (`inert` as it slides
		// away): the new step's takes it.
		if (refocus) this.#focusStep(popup, index);
		if (this.options.modal) {
			this.#releaseInert();
			const keep = [target, this.root, popup.root].filter(
				(element): element is HTMLElement => !!element
			);
			this.#releaseInert = inertOutside(keep);
		}
	}

	/** The text announced for a step; set by the component from the I18n catalog. */
	announcement: (current: number, total: number, title: string) => string = (
		current,
		total,
		title
	) => `${current} / ${total}: ${title}`;

	#announcement(index: number, title: string) {
		return this.announcement(index + 1, this.total, title);
	}

	/** Whether an open layer that is not part of the tour sits above the tour's own. */
	#layerAbove() {
		const open = this.theme.layers.open;
		const own = open.indexOf(this.layer);
		if (own < 0) return false;
		return open.slice(own + 1).some((layer) => {
			for (let current: LayerHandle | null = layer; current; current = current.parent) {
				if (current === this.layer) return false;
			}
			return true;
		});
	}

	/** Wires the shown step to its target: description, styling hook, `advanceOn`, following. */
	#enterTarget(target: HTMLElement, popup: TourPopup, index: number) {
		const step = this.steps[index];
		const cleanups = this.#stepCleanups;
		target.setAttribute('data-tour-target', '');
		cleanups.push(() => target.removeAttribute('data-tour-target'));
		if (this.hasDescription(index)) {
			const id = this.descriptionId(popup, index);
			editTokens(target, 'aria-describedby', id, true);
			cleanups.push(() => editTokens(target, 'aria-describedby', id, false));
		}
		const events = step?.advanceOn
			? Array.isArray(step.advanceOn)
				? step.advanceOn
				: [step.advanceOn]
			: [];
		for (const name of events) {
			cleanups.push(
				on(target, name, (event: Event) => {
					if (this.target !== target) return;
					this.#advance('advance-on', event);
				})
			);
		}
		const follower = this.root ?? target;
		cleanups.push(
			autoUpdate(target, follower, () => this.#measure(true), {
				layoutShift: true,
				elementResize: true
			})
		);
	}

	/** Whether focus is in `popup`, or nowhere (on `<body>`, where a removed control leaves it). */
	#focusIn(popup: TourPopup) {
		const active = getDeepActiveElement(document);
		if (!active || active === document.body) return true;
		return !!popup.root && composedContains(popup.root, active);
	}

	/** Focuses the control step `index` asks for in `popup` (its main action), else its first. */
	#focusStep(popup: TourPopup, index: number) {
		const content = popup.root?.querySelector<HTMLElement>(`[data-tour-content="${index}"]`);
		if (!content) return;
		const target =
			content.querySelector<HTMLElement>('[data-autofocus]') ??
			getTabbableElements(content).find((element) => !element.hasAttribute('data-autofocus-skip'));
		target?.focus({ preventScroll: true });
	}

	#glideTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Lets the popup's next placement glide: the Popover writes its place as `left`/`top` (the
	 * arrow's too), so a transition on those, for as long as the spotlight's glide, carries both
	 * to the new target with the spotlight. Placements after it (a scroll) apply at once again.
	 */
	#glidePopup(popup: TourPopup) {
		const root = popup.root;
		const motion = this.options.motion().spotlight.in;
		const duration = motion.duration ?? 0;
		if (!root || duration <= 0) return;
		const curve = easingBezierStrings[motion.easing ?? 'cubicInOut'];
		const arrow = root.firstElementChild?.querySelector<HTMLElement>(
			':scope > [aria-hidden="true"]'
		);
		const elements = [root, arrow].filter((element): element is HTMLElement => !!element);
		clearTimeout(this.#glideTimer);
		for (const element of elements) {
			element.style.transition = `left ${duration}ms ${curve}, top ${duration}ms ${curve}`;
		}
		this.#glideTimer = setTimeout(() => {
			for (const element of elements) element.style.transition = '';
		}, duration);
	}

	/** Undoes what the shown step did to the page. */
	#leaveStep() {
		for (const cleanup of this.#stepCleanups.splice(0)) cleanup();
		this.#releaseInert();
		this.#releaseInert = () => {};
	}

	/** The popup's Popover asks to close: Escape or the Back gesture close the tour. */
	popupOpenChange = (popup: TourPopup) => (open: boolean, details: OpenChangeDetails) => {
		if (open || popup !== this.currentPopup) return;
		if (details.reason === 'trigger-unmount') {
			// The target left the page: wait for it again, then apply `missingTarget`.
			details.cancel();
			popup.open = false;
			void this.#show(this.step, this.#direction);
			return;
		}
		// The same details: cancelling the tour's change keeps the popup open too.
		this.close(details);
	};

	removePopup = (popup: TourPopup) => {
		this.popups = this.popups.filter((candidate) => candidate !== popup);
	};

	// --- Spotlight --------------------------------------------------------------------------------

	/** The spotlight the current step's target asks for right now. */
	#measureTarget(): TourSpotlight | null {
		const target = this.target;
		if (!target || !target.isConnected || target.getClientRects().length === 0) return null;
		const step = this.current;
		const rect = toRect(target.getBoundingClientRect());
		return spotlightFor(rect, {
			padding: step?.padding ?? this.options.padding,
			radius: step?.radius ?? this.options.radius,
			targetRadius: cornerRadius(target, rect),
			clips: clipsOf(target, this.viewport)
		});
	}

	/**
	 * Re-measures the target. `follow` (a scroll, a resize) moves the spotlight at once; a step
	 * change glides it there when `animate`.
	 */
	#measure(follow: boolean, animate = false) {
		const destination = this.#measureTarget();
		this.#destination = destination;
		if (follow) {
			// Mid-glide the glide picks up the new destination on its next frame.
			if (this.#glide) return;
			if (!sameSpotlight(destination, this.spotlight)) {
				this.spotlight = destination;
				this.instant = true;
			}
			return;
		}
		this.#cancelGlide();
		const duration = this.options.motion().spotlight.in.duration ?? 0;
		if (!animate || duration <= 0 || sameSpotlight(this.spotlight, destination)) {
			this.spotlight = destination;
			this.instant = false;
			return;
		}
		this.instant = false;
		const easing = easingFunctions[this.options.motion().spotlight.in.easing ?? 'cubicInOut'];
		const glide = { from: this.spotlight, start: performance.now(), frame: 0 };
		this.#glide = glide;
		const frame = (now: number) => {
			if (this.#glide !== glide) return;
			const progress = Math.min(1, (now - glide.start) / duration);
			this.spotlight = interpolateSpotlight(glide.from, this.#destination, easing(progress));
			if (progress < 1) glide.frame = requestAnimationFrame(frame);
			else this.#glide = null;
		};
		glide.frame = requestAnimationFrame(frame);
	}

	#cancelGlide() {
		if (this.#glide) cancelAnimationFrame(this.#glide.frame);
		this.#glide = null;
	}

	// --- Keyboard ---------------------------------------------------------------------------------

	#onKeyDown = (event: KeyboardEvent) => {
		if (event.defaultPrevented || !this.options.isOpen) return;
		const popup = this.currentPopup;
		const panel = popup?.root ?? null;
		const target = this.target;
		const active = getDeepActiveElement(document);
		const inPopup = !!panel && !!active && composedContains(panel, active);
		const onTarget = !!target && !!active && composedContains(target, active);
		if (event.key === 'Tab') {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			this.#onTab(event, panel, target, active, inPopup, onTarget);
			return;
		}
		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
		if (!this.options.keyboardNavigation || this.status !== 'ready') return;
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
		if (!inPopup && active !== target) return;
		if (isTextField(active)) return;
		const forward = (event.key === 'ArrowRight') !== (this.#readingDirection() === 'rtl');
		const index = this.step + (forward ? 1 : -1);
		if (index < 0 || index >= this.total) return;
		if (this.#navigate(index, 'arrow-key', event)) event.preventDefault();
	};

	/**
	 * Tab between the popup and the target. The popup is portaled to the end of the page: Tab past
	 * its last control reaches the target, Shift+Tab before its first one too. In modal mode the
	 * two form a cycle, since nothing else on the page can take focus.
	 */
	#onTab(
		event: KeyboardEvent,
		panel: HTMLElement | null,
		target: HTMLElement | null,
		active: Element | null,
		inPopup: boolean,
		onTarget: boolean
	) {
		if (!panel || (!inPopup && !onTarget)) return;
		const popupStops = getTabbableElements(panel);
		const targetStops = target
			? [...(isTabbable(target) ? [target] : []), ...getTabbableElements(target)]
			: [];
		const cycle = [...popupStops, ...targetStops];
		if (cycle.length === 0) return;
		const index = active instanceof HTMLElement ? cycle.indexOf(active) : -1;
		if (!this.options.modal) {
			// Only the popup's edges are bridged; from the target, Tab follows the page.
			if (!inPopup || targetStops.length === 0) return;
			const atEnd = index === popupStops.length - 1 || index < 0;
			const atStart = index === 0 || index < 0;
			if (event.shiftKey ? !atStart : !atEnd) return;
			event.preventDefault();
			(event.shiftKey ? targetStops.at(-1) : targetStops[0])?.focus();
			return;
		}
		event.preventDefault();
		const next =
			index < 0
				? event.shiftKey
					? cycle.at(-1)
					: cycle[0]
				: cycle[(index + (event.shiftKey ? -1 : 1) + cycle.length) % cycle.length];
		next?.focus();
	}

	/** A centred step's popup is placed in the middle of the viewport. */
	readonly centerReference: VirtualElement = {
		getBoundingClientRect: () =>
			new DOMRect(this.viewport.width / 2, this.viewport.height / 2, 0, 0)
	};
	centerPanel = ({ panel }: { panel: HTMLElement }) => {
		const element = document.documentElement;
		return {
			x: Math.max(0, (element.clientWidth - panel.offsetWidth) / 2),
			y: Math.max(0, (element.clientHeight - panel.offsetHeight) / 2)
		};
	};
}
