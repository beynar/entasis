// Behaviour of a NavigationMenu: which panel is open and why, hover switching, the layer that
// dismisses it, Tab order between the triggers and the inline panel area, the arrow keys along
// the bar and inside the open panel, placement of that area under the active trigger, and the
// enter, exit and switch animations.
//
// Keyboard follows the WAI-ARIA APG disclosure navigation pattern, with Base UI's choices where
// the pattern leaves room: ArrowDown opens a trigger without moving focus, arrows along the bar
// only move focus (no wrap), and arrows inside a panel wrap.
//
// The panel area is one viewport rendered inline inside the `<nav>`, after the trigger list. It
// is never portaled, so the document order stays the reading order; `useTabBridge` carries Tab
// from the open trigger into the panel and on to whatever follows the trigger.
import { getContext, setContext, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { useTheme } from '$lib/components/Theme/theme.state.svelte.js';
import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import {
	createOpenChangeDetails,
	type OpenChangeDetails,
	type OpenChangeInit
} from '$lib/utils/openChange.js';
import type { DeepPartial, MotionSpec } from '$lib/utils/motion/index.js';
import { useOpenLifecycle } from '$lib/utils/openLifecycle.svelte.js';
import { useSafeArea } from '$lib/utils/safeArea.svelte.js';
import { useTabBridge } from '$lib/utils/useTabBridge.svelte.js';
import { useDirection, type Direction } from '$lib/utils/useDirection.svelte.js';
import { hasShortcutModifier } from '$lib/utils/useKeyDown.svelte.js';
import {
	composedContains,
	getDeepActiveElement,
	getTabbableAfter,
	getTabbableElements,
	isTextField
} from '$lib/utils/focus.js';
import type { NavigationMenuItem, NavigationMenuPanel } from './navigationMenu.props.js';
import { useNavigationMenuMotion } from './navigationMenu.theme.js';

/** Space in px kept between the panel area and the edges of the layout viewport. */
const COLLISION_PADDING = 8;
/** Distance in px the incoming panel travels when it replaces another. */
const SWITCH_DISTANCE = 16;
/** How long a panel switch counts as under way: the window in which size and slide animations run. */
const SWITCH_WINDOW = 300;

const FOCUS_VISIBLE = { preventScroll: true, focusVisible: true } as FocusOptions;
const ITEM_SELECTOR = '[data-slot="navigation-menu-trigger"], [data-slot="navigation-menu-link"]';

const isPanel = <Value extends string>(
	item: NavigationMenuItem<Value>
): item is NavigationMenuPanel<Value> => item.type === 'panel';

export type NavigationMenuStateOptions<Value extends string> = {
	id: string;
	items: () => NavigationMenuItem<Value>[];
	/** The raw value: controlled, or the retained uncontrolled one. */
	value: () => Value | null;
	setValue: (value: Value | null) => void;
	onValueChange: () =>
		((payload: { value: Value | null; details: OpenChangeDetails }) => void) | undefined;
	openOnHover: () => boolean;
	delay: () => number;
	closeDelay: () => number;
	keepMounted: () => boolean;
	dir: () => Direction | undefined;
	transition: () => ResponsiveProps<FSOProps> | undefined;
	motion: () => DeepPartial<MotionSpec> | undefined;
	onAfterOpen: () => (() => void) | undefined;
	onAfterClose: () => (() => void) | undefined;
};

type ChangeInit = OpenChangeInit & { reason: NonNullable<OpenChangeInit['reason']> };

/** Reasons after which focus that sat inside the panel area goes back to the trigger. */
const RESTORING_REASONS = new Set<string>(['escape-key', 'item-press', 'close-press']);

export function useNavigationMenuState<Value extends string>(
	options: NavigationMenuStateOptions<Value>
) {
	const theme = useTheme();
	const resolveMotion = useNavigationMenuMotion();

	const panels = $derived(options.items().filter(isPanel));
	const panelIndex = (value: Value | null) =>
		value === null ? -1 : panels.findIndex((panel) => panel.value === value);

	// The open panel: the one the value names, as long as it exists and is enabled.
	const activeItem = $derived(
		panels.find((panel) => panel.value === options.value() && !panel.disabled) ?? null
	);
	// The open panel's value, compared by value: a parent that rebuilds `items` on every render
	// hands out new objects for the same panel, and that is not a change.
	const activeValue = $derived<Value | null>(activeItem?.value ?? null);
	const isOpen = $derived(activeValue !== null);
	// The panel the area shows. It keeps the last open one through the exit animation, so the
	// popup does not empty itself while it fades out.
	let displayValue = $state<Value | null>(untrack(() => activeValue));
	$effect.pre(() => {
		if (activeValue !== null) displayValue = activeValue;
	});

	const triggers = new SvelteMap<Value, HTMLElement>();
	const panelElements = new SvelteMap<Value, HTMLElement>();
	const activeTrigger = $derived(
		displayValue === null ? null : (triggers.get(displayValue) ?? null)
	);
	const activePanel = $derived(
		displayValue === null ? null : (panelElements.get(displayValue) ?? null)
	);
	/** The nested inline panels that are expanded, keyed by their value. */
	const nestedOpen = new SvelteSet<string>();

	let navElement = $state.raw<HTMLElement | null>(null);
	let viewportElement = $state.raw<HTMLElement | null>(null);
	let popupElement = $state.raw<HTMLElement | null>(null);

	const getDirection = useDirection(
		() => navElement,
		() => options.dir()
	);

	// The panel that hovering opened (or switched to) and that nothing has pinned since: it closes
	// when the pointer leaves. A press, the keyboard or code leaves `null`, and the panel then
	// stays until dismissed. Plain fields: read by handlers.
	let hoverValue: Value | null = null;
	// Set by a request just before it writes the value and consumed by the effect that sees the
	// panel change, so a value the parent assigns by itself never counts as a hover.
	let pendingHover: Value | null = null;
	let switchedAt = -Infinity;
	let activationDirection = $state<'left' | 'right' | null>(null);
	const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
	const isSwitching = () => now() - switchedAt < SWITCH_WINDOW;

	// Notices a panel replacing another (a switch) as opposed to opening from closed. Runs before
	// the DOM update so the panel and size animations that start with it see the flag.
	let previousValue: Value | null = untrack(() => activeValue);
	$effect.pre(() => {
		const next = activeValue;
		untrack(() => {
			const from = previousValue;
			previousValue = next;
			hoverValue = next !== null && pendingHover === next ? next : null;
			pendingHover = null;
			if (next === null) {
				switchedAt = -Infinity;
				activationDirection = null;
				return;
			}
			if (from === null) {
				switchedAt = -Infinity;
				activationDirection = null;
				return;
			}
			if (from === next) return;
			switchedAt = now();
			const later = panelIndex(next) > panelIndex(from);
			const physical = (later ? 'right' : 'left') as 'left' | 'right';
			activationDirection =
				getDirection() === 'rtl' ? (physical === 'right' ? 'left' : 'right') : physical;
		});
	});

	// ---- requesting a change ------------------------------------------------------------

	const insideChildLayer = (node: Node | null) =>
		!!node &&
		theme.layers.open.some(
			(open) =>
				open !== layer && open.parent === layer && [...open.nodes].some((n) => n.contains(node))
		);

	/**
	 * The one path to a change of the open panel: `onValueChange` runs first and may cancel.
	 * Returns whether the change was applied.
	 */
	function requestChange(next: Value | null, init: ChangeInit): boolean {
		const current = options.value();
		if (next === current) return false;
		// A panel that is missing or disabled cannot be opened.
		if (next !== null && !panels.some((panel) => panel.value === next && !panel.disabled)) {
			return false;
		}
		const details = createOpenChangeDetails(init);
		options.onValueChange()?.({ value: next, details });
		if (details.isCanceled) return false;
		const previous = displayValue;
		const doc = navElement?.ownerDocument ?? document;
		const active = getDeepActiveElement(doc);
		// Safari does not focus a link or button on click, so the press target counts as well.
		const target = init.event?.target;
		const focusInside =
			!!popupElement &&
			((!!active && composedContains(popupElement, active)) ||
				(target instanceof Node && composedContains(popupElement, target)));
		// Safari does not focus a button on click either, so a panel opened by the pointer has
		// focus on the page body: Escape still hands it back to the trigger, since nothing else holds it.
		const focusAdrift =
			init.reason === 'escape-key' &&
			(!active || active === doc.body || active === doc.documentElement);
		if (next !== null && init.reason === 'trigger-hover') {
			pendingHover = next;
			// A parent that refuses the value leaves the flag unconsumed; it must not outlive this task.
			setTimeout(() => (pendingHover = null));
		}
		options.setValue(next);
		if (next === null) {
			nestedOpen.clear();
			if ((focusInside || focusAdrift) && RESTORING_REASONS.has(init.reason) && previous !== null) {
				const trigger = triggers.get(previous);
				trigger?.focus(
					details.interaction === 'keyboard' ? FOCUS_VISIBLE : { preventScroll: true }
				);
			}
		}
		return true;
	}

	/** Closes every level of the menu. */
	const close = (init: Partial<ChangeInit> = {}) =>
		requestChange(null, { reason: 'close-press', ...init });

	/** A link press anywhere in the tree closes every level, once. */
	const pressLink = (event: MouseEvent) => {
		if (options.value() === null) return;
		requestChange(null, { reason: 'item-press', event });
	};

	function pressTrigger(value: Value, event: MouseEvent) {
		const trigger = triggers.get(value);
		// Safari does not focus a button on click. Focus it, so Tab, ArrowDown and Escape carry on
		// from the trigger as they do after a click in every other engine.
		if (trigger && event.detail > 0) {
			const active = getDeepActiveElement(trigger.ownerDocument);
			if (active !== trigger) {
				trigger.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
			}
		}
		const current = options.value();
		if (current === value) {
			// A pointer press on a panel that hovering opened turns it into a pressed one; the next
			// press closes it. Enter and Space (a click with no pointer, `detail` 0) toggle as usual.
			if (hoverValue === value && event.detail > 0) {
				hoverValue = null;
				return;
			}
			requestChange(null, { reason: 'trigger-press', event, trigger });
			return;
		}
		requestChange(value, { reason: 'trigger-press', event, trigger });
	}

	function hoverTrigger(value: Value, event: MouseEvent) {
		if (!options.openOnHover()) return;
		requestChange(value, {
			reason: 'trigger-hover',
			event,
			trigger: triggers.get(value),
			interaction: 'mouse'
		});
	}

	// ---- layer: Escape and outside presses -------------------------------------------------

	const layer = theme.layers.register({
		kind: 'popover',
		isOpen: () => isOpen,
		isModal: () => false,
		dismissOnEscape: () => true,
		dismissOnOutside: () => true,
		onDismiss: (request) => requestChange(null, request)
	});

	function handleFocusOut(event: FocusEvent) {
		if (!isOpen || !navElement) return;
		const next = event.relatedTarget;
		// `null` is focus leaving the window or going to the page body: nothing to follow.
		if (!(next instanceof Node) || navElement.contains(next) || insideChildLayer(next)) return;
		requestChange(null, { reason: 'focus-out', event, interaction: 'keyboard' });
	}

	// ---- hover: closing --------------------------------------------------------------------

	const isPointerOver = () =>
		!!(activeTrigger?.matches(':hover') || popupElement?.matches(':hover'));

	const safeArea = useSafeArea({
		isActive: () => isOpen && options.openOnHover(),
		callback: (event) => {
			// Only a panel the pointer opened closes when the pointer leaves it.
			if (hoverValue === null || !isOpen) return;
			// A trigger the pointer has just entered re-anchors the area; a pause there is no exit.
			if (isPointerOver()) return;
			// Focus inside the panel means the keyboard took over from the pointer.
			const active = getDeepActiveElement(navElement?.ownerDocument ?? document);
			if (active && popupElement && composedContains(popupElement, active)) return;
			requestChange(null, { reason: 'trigger-hover', event, interaction: 'mouse' });
		},
		offset: COLLISION_PADDING,
		closeDelay: () => options.closeDelay()
	});

	// ---- Tab order -------------------------------------------------------------------------

	useTabBridge({
		isActive: () => isOpen,
		anchor: () => activeTrigger,
		panel: () => activePanel,
		onLeave: (event) => {
			requestChange(null, { reason: 'focus-out', event, interaction: 'keyboard' });
		}
	});

	// ---- lifecycle and animation -----------------------------------------------------------

	const lifecycle = useOpenLifecycle({
		isOpen: () => isOpen,
		animated: () => popupElement,
		onAfterOpen: () => options.onAfterOpen()?.(),
		onAfterClose: () => options.onAfterClose()?.()
	});
	/** Whether the popup is in the DOM at all. */
	const rendered = $derived(options.keepMounted() || isOpen || lifecycle.status !== 'closed');
	/** Whether the popup shows. A kept-mounted one stays in the DOM under `hidden` when closed. */
	const visible = $derived(isOpen || lifecycle.status === 'exiting');

	let handledOpen = untrack(() => isOpen);
	let exitAnimation: Animation | null = null;
	const playPopup = (element: HTMLElement, direction: 'in' | 'out') => {
		const spec = resolveMotion(undefined, {
			motion: options.motion(),
			transition: options.transition()
		})[direction];
		const duration = spec.duration ?? 0;
		if (!duration || typeof element.animate !== 'function') return null;
		const hiddenFrame = {
			opacity: spec.opacity ?? 0,
			transform: `translate(${typeof spec.x === 'number' ? spec.x : 0}px, ${typeof spec.y === 'number' ? spec.y : 0}px) scale(${spec.scale ?? 1})`
		};
		const shownFrame = { opacity: 1, transform: 'translate(0px, 0px) scale(1)' };
		return element.animate(
			direction === 'in' ? [hiddenFrame, shownFrame] : [shownFrame, hiddenFrame],
			{
				duration,
				easing: easingBezierStrings[spec.easing ?? 'cubicOut'],
				fill: direction === 'out' ? 'forwards' : 'none'
			}
		);
	};
	$effect(() => {
		const open = isOpen;
		const element = popupElement;
		untrack(() => {
			// No popup to animate yet: a mounting popup runs this again once it exists.
			if (!element || open === handledOpen) return;
			handledOpen = open;
			exitAnimation?.cancel();
			exitAnimation = playPopup(element, open ? 'in' : 'out');
			if (open) exitAnimation = null;
		});
	});

	/** Slides a panel in from the side of the trigger that was open before it. */
	const animatePanel = (element: HTMLElement) => {
		if (!isSwitching() || activationDirection === null) return;
		const spec = resolveMotion(undefined, {
			motion: options.motion(),
			transition: options.transition()
		}).in;
		const duration = spec.duration ?? 0;
		if (!duration || typeof element.animate !== 'function') return;
		const from = activationDirection === 'right' ? SWITCH_DISTANCE : -SWITCH_DISTANCE;
		return element.animate(
			[
				{ opacity: 0, transform: `translateX(${from}px)` },
				{ opacity: 1, transform: 'translateX(0px)' }
			],
			{ duration, easing: easingBezierStrings[spec.easing ?? 'cubicOut'] }
		);
	};

	// ---- placement -------------------------------------------------------------------------

	// The popup lines up with the active trigger's inline edge and is clamped to the layout
	// viewport (pinch-zoom does not move it). The clamp is done in CSS from these px values, so
	// it holds while the popup animates its size.
	$effect(() => {
		const nav = navElement;
		const trigger = activeTrigger;
		const viewport = viewportElement;
		if (!nav || !trigger || !viewport || !visible) return;
		const place = () => {
			const navRect = nav.getBoundingClientRect();
			const rect = trigger.getBoundingClientRect();
			const left = navRect.left + nav.clientLeft;
			const top = navRect.top + nav.clientTop;
			const width = nav.ownerDocument.documentElement.clientWidth;
			const style = viewport.style;
			style.setProperty('--navigation-menu-anchor-start', `${rect.left - left}px`);
			style.setProperty('--navigation-menu-anchor-end', `${rect.right - left}px`);
			style.setProperty('--navigation-menu-anchor-bottom', `${rect.bottom - top}px`);
			style.setProperty('--navigation-menu-min-x', `${COLLISION_PADDING - left}px`);
			style.setProperty('--navigation-menu-max-x', `${width - COLLISION_PADDING - left}px`);
			style.setProperty('--anchor-width', `${rect.width}px`);
			style.setProperty('--anchor-height', `${rect.height}px`);
		};
		place();
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
		observer?.observe(nav);
		observer?.observe(trigger);
		const offResize = on(nav.ownerDocument.defaultView ?? window, 'resize', place);
		return () => {
			observer?.disconnect();
			offResize();
		};
	});

	// ---- value that disappears --------------------------------------------------------------

	// The open panel was removed or disabled: the menu cannot stay open on nothing.
	$effect(() => {
		const current = options.value();
		const enabled = panels.some((panel) => panel.value === current && !panel.disabled);
		if (current === null || enabled) return;
		untrack(() => {
			// Not cancelable: there is nothing left to keep.
			requestChange(null, { reason: 'trigger-unmount', cancelable: false });
		});
	});

	// ---- keyboard --------------------------------------------------------------------------

	function enabledItems(list: HTMLElement) {
		return Array.from(list.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
			(element) => !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true'
		);
	}

	/** The step an arrow key takes along a line of items, mirrored in right-to-left. */
	function arrowStep(key: string, vertical: boolean) {
		const rtl = getDirection() === 'rtl';
		if (key === 'ArrowRight') return rtl ? -1 : 1;
		if (key === 'ArrowLeft') return rtl ? 1 : -1;
		if (vertical && key === 'ArrowDown') return 1;
		if (vertical && key === 'ArrowUp') return -1;
		return 0;
	}

	/**
	 * Tab from an entry of the bar that is not the open trigger, where the next stop in the page is
	 * the panel area (it follows the list in the document): the panel belongs to its trigger, so
	 * focus skips it and goes on after the menu. Without this, focus would wander through a panel
	 * that is not this entry's and then jump back to the entry after the open trigger.
	 */
	function skipForeignPanel(event: KeyboardEvent, current: HTMLElement) {
		const viewport = viewportElement;
		if (!isOpen || event.shiftKey || !viewport || current === activeTrigger) return;
		const next = getTabbableAfter(current);
		if (!next || !composedContains(viewport, next)) return;
		const after = getTabbableAfter(current, { exclude: viewport });
		if (!after) return;
		event.preventDefault();
		after.focus(FOCUS_VISIBLE);
	}

	/**
	 * Arrow keys, Home and End move between the bar's triggers and links; Tab still visits each.
	 * They only move focus: the open panel, if any, stays as it is (Enter, Space or ArrowDown on
	 * another trigger switches to its panel).
	 */
	const list: Attachment<HTMLElement> = (node) =>
		on(node, 'keydown', (event) => {
			if (event.defaultPrevented) return;
			const current = (event.target as Element).closest<HTMLElement>(ITEM_SELECTOR);
			if (!current || !node.contains(current)) return;
			if (event.key === 'Tab') {
				if (!event.ctrlKey && !event.metaKey) skipForeignPanel(event, current);
				return;
			}
			if (hasShortcutModifier(event)) return;
			const step = arrowStep(event.key, false);
			const edge = event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : null;
			if (!step && !edge) return;
			const items = enabledItems(node);
			const index = items.indexOf(current);
			if (index === -1) return;
			const target =
				edge === 'first' ? items[0] : edge === 'last' ? items.at(-1) : items[index + step];
			event.preventDefault();
			if (!target || target === current) return;
			target.focus(FOCUS_VISIBLE);
		});

	/** Whether the arrow keys belong to the control itself: it edits text or picks an option. */
	const ownsArrowKeys = (element: Element): boolean =>
		isTextField(element) || element.matches('select');

	/**
	 * Inside the open panel, the arrow keys move between its links and buttons (ArrowDown and
	 * the inline-end arrow forward, ArrowUp and the inline-start arrow back, wrapping at either
	 * end), and Home and End jump to the first and last. Disabled links and collapsed nested
	 * levels are not tab stops, so they are skipped. A text field keeps its arrow keys, and a
	 * control that handles them itself (it calls `preventDefault()`) wins.
	 */
	function panelKeydown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		const panel = activePanel;
		const target = event.target;
		if (!isOpen || !panel || !(target instanceof HTMLElement)) return;
		if (!composedContains(panel, target)) return;
		if (event.key === 'Tab') {
			leaveAtPageEnd(event, panel, target);
			return;
		}
		if (hasShortcutModifier(event) || ownsArrowKeys(target)) return;
		const step = arrowStep(event.key, true);
		const edge = event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : null;
		if (!step && !edge) return;
		const items = getTabbableElements(panel).filter((element) => !ownsArrowKeys(element));
		const index = items.indexOf(target);
		if (index === -1 || items.length === 0) return;
		const next =
			edge === 'first'
				? items[0]
				: edge === 'last'
					? items[items.length - 1]
					: items[(index + step + items.length) % items.length];
		event.preventDefault();
		if (next !== target) next.focus(FOCUS_VISIBLE);
	}

	/**
	 * Tab past the panel's last control when nothing in the page follows the trigger: the Tab
	 * bridge leaves the key to the engine, which moves focus out of the page, and the panel closes
	 * as it does when Tab moves on to anything else.
	 */
	function leaveAtPageEnd(event: KeyboardEvent, panel: HTMLElement, target: HTMLElement) {
		const anchor = activeTrigger;
		if (event.shiftKey || event.ctrlKey || event.metaKey || !anchor) return;
		if (getTabbableElements(panel).at(-1) !== target) return;
		if (getTabbableAfter(anchor, { exclude: viewportElement })) return;
		requestChange(null, { reason: 'focus-out', event, interaction: 'keyboard' });
	}

	function triggerKeydown(value: Value, event: KeyboardEvent) {
		if (event.defaultPrevented || event.key !== 'ArrowDown' || hasShortcutModifier(event)) return;
		event.preventDefault();
		if (options.value() === value) {
			// Already open: move into it.
			const first = activePanel ? getTabbableElements(activePanel)[0] : undefined;
			first?.focus(FOCUS_VISIBLE);
			return;
		}
		// Opening keeps focus on the trigger; Tab or ArrowDown again enters the panel.
		requestChange(value, {
			reason: 'list-navigation',
			event,
			trigger: triggers.get(value),
			interaction: 'keyboard'
		});
	}

	// ---- attachments -----------------------------------------------------------------------

	const root: Attachment<HTMLElement> = (node) => {
		navElement = node;
		const offLayer = layer.node(node);
		return () => {
			offLayer();
			if (navElement === node) navElement = null;
		};
	};

	const trigger =
		(value: Value): Attachment<HTMLElement> =>
		(node) =>
			untrack(() => {
				triggers.set(value, node);
				const offKeydown = on(node, 'keydown', (event) => triggerKeydown(value, event));
				return () => {
					offKeydown();
					if (triggers.get(value) === node) triggers.delete(value);
				};
			});

	const viewport: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			viewportElement = node;
			const offSafeArea = safeArea.floatingReference(node);
			return () => {
				offSafeArea();
				if (viewportElement === node) viewportElement = null;
			};
		});

	const popup: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			popupElement = node;
			const offKeydown = on(node, 'keydown', panelKeydown);
			return () => {
				offKeydown();
				if (popupElement === node) popupElement = null;
			};
		});

	const panel =
		(value: Value): Attachment<HTMLElement> =>
		(node) => {
			untrack(() => panelElements.set(value, node));
			// Reads the state it animates for: a kept-mounted panel runs again when it becomes active.
			const active = displayValue === value && isOpen;
			const animation = active ? untrack(() => animatePanel(node)) : undefined;
			return () => {
				animation?.cancel();
				untrack(() => {
					if (panelElements.get(value) === node) panelElements.delete(value);
				});
			};
		};

	return {
		get panels() {
			return panels;
		},
		get isOpen() {
			return isOpen;
		},
		get value() {
			return activeValue;
		},
		get displayValue() {
			return displayValue;
		},
		get displayItem() {
			return panels.find((panel) => panel.value === displayValue) ?? null;
		},
		get rendered() {
			return rendered;
		},
		get visible() {
			return visible;
		},
		get status() {
			return lifecycle.status;
		},
		get activationDirection() {
			return activationDirection;
		},
		get direction() {
			return getDirection();
		},
		get openOnHover() {
			return options.openOnHover();
		},
		get keepMounted() {
			return options.keepMounted();
		},
		get delay() {
			return options.delay();
		},
		isSwitching,
		panelIndex,
		triggerId: (value: Value) => `${options.id}-trigger-${panelIndex(value)}`,
		panelId: (value: Value) => `${options.id}-panel-${panelIndex(value)}`,
		/** Whether the panel for `value` has its element in the DOM now. */
		hasPanel: (value: Value) => panelElements.has(value),
		isOpenFor: (value: Value) => activeValue === value,
		safeArea,
		nestedOpen,
		close,
		pressLink,
		pressTrigger,
		hoverTrigger,
		handleFocusOut,
		layer,
		root,
		list,
		trigger,
		viewport,
		popup,
		panel
	};
}

export type NavigationMenuState<Value extends string = string> = ReturnType<
	typeof useNavigationMenuState<Value>
>;

const CONTEXT = Symbol('entasis:navigation-menu');

export function setNavigationMenuState(state: NavigationMenuState<string>) {
	setContext(CONTEXT, state);
	return state;
}

export function getNavigationMenuState() {
	return getContext<NavigationMenuState<string>>(CONTEXT);
}
