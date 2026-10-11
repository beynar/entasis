import { getContext, tick, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { ThemeState } from '$lib/components/Theme/theme.state.svelte.js';
import { defaultMotionTokens } from '$lib/tailwind/scales.js';
import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
import type { BaseTransitionParams } from '$lib/transitions/transition.js';
import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
import {
	openStateAttributes,
	transitionStatusAttributes,
	type OpenStateAttributes,
	type OpenTransitionStatus,
	type TransitionStatusAttributes
} from '$lib/utils/stateAttributes.js';

/**
 * CSS variable on the panel: its measured height in px while it animates, `auto` once open and
 * `0px` once closed. Style inner content against it, or animate other properties with it.
 */
export const DISCLOSURE_PANEL_HEIGHT_VARIABLE = '--disclosure-panel-height';

/** Enter (`in`) and exit (`out`) timing; a component's resolved motion preset fits as it is. */
export type DisclosurePanelMotion = {
	in?: BaseTransitionParams;
	out?: BaseTransitionParams;
};

export type DisclosurePanelOptions = {
	/** Whether the panel is open. Read reactively. */
	open: () => boolean;
	/**
	 * Keep the closed panel in the DOM under `hidden="until-found"`, so the browser's find-in-page,
	 * text fragments and `#id` links can reach its content and open it. Implies `keepMounted`.
	 * That state hides only the content (`content-visibility: hidden`): the panel's own padding,
	 * borders and margins stay laid out, so put them on an element inside the panel.
	 */
	hiddenUntilFound?: () => boolean | undefined;
	/** Keep the closed panel in the DOM under `hidden`, preserving its content's state. */
	keepMounted?: () => boolean | undefined;
	/** Enter and exit timing. Durations default to the Theme's `normal` step; reduced motion zeroes them. */
	motion?: () => DisclosurePanelMotion | undefined;
	/**
	 * Find-in-page matched content inside the closed panel. Open the panel synchronously here
	 * (through the owner's usual open-change path). If the panel is still closed a task later, the
	 * content goes back under `hidden="until-found"`. That open plays no animation.
	 */
	onBeforeMatch?: (event: Event) => void;
	/** Runs once when an open finishes: after the enter animation, or at once without motion. */
	onAfterOpen?: () => void;
	/**
	 * Runs once when a close finishes: after the exit animation, at once without motion, or when
	 * the panel element is removed mid-close.
	 */
	onAfterClose?: () => void;
};

export type DisclosurePanelAttributes = OpenStateAttributes &
	TransitionStatusAttributes & {
		/** `'until-found'` or `true` while the panel is closed and kept in the DOM. */
		hidden: true | 'until-found' | undefined;
	};

// The block-axis box a collapse squeezes to nothing, as `slide` does.
const BOX_PROPERTIES = [
	'height',
	'paddingTop',
	'paddingBottom',
	'borderTopWidth',
	'borderBottomWidth',
	'marginTop',
	'marginBottom'
] as const;
type Box = Record<(typeof BOX_PROPERTIES)[number], string>;

const COLLAPSED = Object.fromEntries(BOX_PROPERTIES.map((name) => [name, '0px'])) as Box;

// Computed values are used values in px while rendered, and mid-animation values while an
// animation runs, whatever the panel's box-sizing.
const readBox = (element: HTMLElement): Box => {
	const style = getComputedStyle(element);
	return Object.fromEntries(
		BOX_PROPERTIES.map((name) => {
			const value = style[name];
			return [name, value && value.endsWith('px') ? value : '0px'];
		})
	) as Box;
};

const overrideStyle = (element: HTMLElement, property: string, value: string) => {
	const previous = element.style.getPropertyValue(property);
	const priority = element.style.getPropertyPriority(property);
	element.style.setProperty(property, value);
	return () => {
		if (previous === '') element.style.removeProperty(property);
		else element.style.setProperty(property, previous, priority);
	};
};

/**
 * Drives a disclosure panel (Collapsible, Accordion items, Sidebar groups): its `hidden` state,
 * a height animation, find-in-page reveal and completion callbacks that always fire once.
 *
 * Create it while the owner initialises, spread `attributes` on the panel, attach `attach`, and
 * render the panel while `rendered` is true:
 *
 * ```svelte
 * const panel = disclosurePanel({ open: () => isOpen, hiddenUntilFound: () => hiddenUntilFound,
 *   onBeforeMatch: () => setOpen(true), onAfterOpen, onAfterClose, motion: () => contentMotion });
 *
 * {#if panel.rendered}
 *   <div id={contentId} {...panel.attributes} {@attach panel.attach}>…</div>
 * {/if}
 * ```
 *
 * `attributes` carries `hidden` (`'until-found'` with `hiddenUntilFound`), `data-open` /
 * `data-closed` and `data-entering` / `data-exiting`, so server-rendered markup is already right.
 * The enter and exit animations run on the panel's height, block padding, borders and margins
 * with the Web Animations API; `--disclosure-panel-height` holds the measured height meanwhile.
 * An animation interrupted by the opposite change reverses from where it is. The first state is
 * never animated.
 */
export class DisclosurePanel {
	readonly #options: DisclosurePanelOptions;
	readonly #theme: ThemeState | undefined;
	#status = $state<OpenTransitionStatus>('closed');
	#element: HTMLElement | null = null;
	// The open state the panel rests in or is moving to.
	#target: boolean;
	// The completion callback the current change still owes.
	#pending: 'open' | 'close' | null = null;
	#animation: Animation | null = null;
	#animationId = 0;
	// A finished collapse kept filled until `hidden` or the unmount reaches the DOM.
	#lingering: Animation | null = null;
	#restoreOverflow: (() => void) | null = null;
	// Set by find-in-page: the next open reveals the content at once.
	#skipOpenMotion = false;
	#revealTimeout: ReturnType<typeof setTimeout> | undefined;
	#revealFrame: number | undefined;

	constructor(options: DisclosurePanelOptions) {
		this.#options = options;
		this.#theme = getContext<ThemeState | undefined>('entasisTheme');
		const open = untrack(() => !!options.open());
		this.#target = open;
		this.#status = open ? 'open' : 'closed';
		$effect(() => {
			const next = !!options.open();
			untrack(() => this.#sync(next));
		});
	}

	/** Whether the owner reports the panel open. */
	get open(): boolean {
		return !!this.#options.open();
	}

	/** `closed`, `entering`, `open` or `exiting`. */
	get status(): OpenTransitionStatus {
		return this.#status;
	}

	/** Whether the panel belongs in the DOM: open, closing, or kept while closed. */
	get rendered(): boolean {
		return this.open || this.#status !== 'closed' || this.#keepsElement();
	}

	/** `hidden` and the state attributes for the panel element. */
	get attributes(): DisclosurePanelAttributes {
		const open = this.open;
		const hidden = !open && this.#status === 'closed';
		return {
			hidden: hidden ? (this.#hiddenUntilFound() ? 'until-found' : true) : undefined,
			...openStateAttributes(open),
			...transitionStatusAttributes(this.#status)
		};
	}

	/** Attach to the panel element. */
	attach: Attachment<HTMLElement> = (element) =>
		untrack(() => {
			this.#element = element;
			element.style.setProperty(
				DISCLOSURE_PANEL_HEIGHT_VARIABLE,
				this.#status === 'open' ? 'auto' : '0px'
			);
			const onBeforeMatch = (event: Event) => this.#handleBeforeMatch(element, event);
			element.addEventListener('beforematch', onBeforeMatch);
			// An open that started before the panel was rendered animates now.
			if (this.#pending && !this.#animation) this.#run();
			return () => {
				element.removeEventListener('beforematch', onBeforeMatch);
				this.#cancelReveal();
				if (this.#element !== element) return;
				this.#element = null;
				this.#stopAnimation();
				// A panel removed while it closes has finished closing.
				if (this.#pending === 'close') this.#finish();
			};
		});

	#hiddenUntilFound = () => !!this.#options.hiddenUntilFound?.();

	#keepsElement = () => this.#hiddenUntilFound() || !!this.#options.keepMounted?.();

	#isOpenNow = () => untrack(() => !!this.#options.open());

	#sync(open: boolean) {
		if (open === this.#target) return;
		this.#target = open;
		this.#pending = open ? 'open' : 'close';
		this.#status = open ? 'entering' : 'exiting';
		this.#run();
	}

	#timing(open: boolean) {
		const reduced = this.#theme ? this.#theme.preferReducesMotion : prefersReducedMotion();
		const motion = this.#options.motion?.();
		const params = (open ? motion?.in : motion?.out) ?? {};
		const tokens = this.#theme?.motion ?? defaultMotionTokens;
		return {
			duration: reduced ? 0 : (params.duration ?? tokens.duration.normal),
			delay: params.delay ?? 0,
			easing: easingBezierStrings[params.easing ?? tokens.easing.standard]
		};
	}

	#run() {
		const element = this.#element;
		const open = this.#target;
		if (!element) {
			// An open waits for its element; a close has nothing left to collapse.
			if (!open) this.#finish();
			return;
		}
		// Read before stopping, so an interrupted animation reverses from where it is.
		const current = this.#animation || this.#lingering ? readBox(element) : null;
		this.#stopAnimation();
		const skip = open && this.#skipOpenMotion;
		this.#skipOpenMotion = false;
		const timing = this.#timing(open);
		if (skip || timing.duration <= 0) {
			this.#finish();
			return;
		}
		// Measured with the variable at `auto`, so a panel styled `height: var(…)` reports its content.
		element.style.setProperty(DISCLOSURE_PANEL_HEIGHT_VARIABLE, 'auto');
		const natural = readBox(element);
		const from = current ?? (open ? COLLAPSED : natural);
		const to = open ? natural : COLLAPSED;
		element.style.setProperty(
			DISCLOSURE_PANEL_HEIGHT_VARIABLE,
			`${parseFloat(natural.height) || 0}px`
		);
		this.#restoreOverflow = overrideStyle(element, 'overflow', 'hidden');
		const id = ++this.#animationId;
		// `both`: the first keyframe holds through a delay, so the panel doesn't show at its final
		// or CSS height first, and the last one holds until `#finish` settles the styles.
		const animation = element.animate([from, to], {
			duration: timing.duration,
			delay: timing.delay,
			easing: timing.easing,
			fill: 'both'
		});
		this.#animation = animation;
		animation.onfinish = () => {
			if (id === this.#animationId) this.#finish();
		};
	}

	#finish() {
		const open = this.#target;
		const element = this.#element;
		const collapse = !open && element ? this.#animation : null;
		if (collapse) {
			// Keep the collapsed fill until `hidden` or the unmount lands, so the panel never
			// flashes back to full height for a frame.
			this.#animation = null;
			this.#animationId += 1;
			this.#lingering = collapse;
			void tick().then(() => {
				if (this.#lingering === collapse) this.#releaseLingering();
			});
		} else {
			this.#stopAnimation();
		}
		element?.style.setProperty(DISCLOSURE_PANEL_HEIGHT_VARIABLE, open ? 'auto' : '0px');
		this.#status = open ? 'open' : 'closed';
		const pending = this.#pending;
		this.#pending = null;
		if (pending === 'open') this.#options.onAfterOpen?.();
		else if (pending === 'close') this.#options.onAfterClose?.();
	}

	#releaseLingering() {
		this.#lingering?.cancel();
		this.#lingering = null;
		this.#restoreOverflow?.();
		this.#restoreOverflow = null;
	}

	#stopAnimation() {
		this.#animationId += 1;
		const animation = this.#animation;
		this.#animation = null;
		animation?.cancel();
		this.#releaseLingering();
	}

	#handleBeforeMatch(element: HTMLElement, event: Event) {
		if (this.#target) return;
		this.#skipOpenMotion = true;
		// The browser measures the match as soon as this event returns; a styled collapse must
		// not hide it.
		element.style.setProperty(DISCLOSURE_PANEL_HEIGHT_VARIABLE, 'auto');
		this.#options.onBeforeMatch?.(event);
		this.#cancelReveal();
		// An owner that refuses the open (a controlled parent ignoring the change) leaves the panel
		// closed: give its state a task to arrive, then hide the content again, still findable.
		this.#revealTimeout = setTimeout(() => {
			this.#revealTimeout = undefined;
			if (this.#isOpenNow()) return;
			this.#revealFrame = requestAnimationFrame(() => {
				this.#revealFrame = undefined;
				if (this.#isOpenNow()) return;
				this.#skipOpenMotion = false;
				if (this.#element !== element) return;
				element.style.setProperty(DISCLOSURE_PANEL_HEIGHT_VARIABLE, '0px');
				if (this.#hiddenUntilFound()) element.setAttribute('hidden', 'until-found');
			});
		}, 0);
	}

	#cancelReveal() {
		clearTimeout(this.#revealTimeout);
		this.#revealTimeout = undefined;
		if (this.#revealFrame !== undefined) cancelAnimationFrame(this.#revealFrame);
		this.#revealFrame = undefined;
	}
}

/** Creates a `DisclosurePanel` controller; call it while the owning component initialises. */
export const disclosurePanel = (options: DisclosurePanelOptions): DisclosurePanel =>
	new DisclosurePanel(options);
