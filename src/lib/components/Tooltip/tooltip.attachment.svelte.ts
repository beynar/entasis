import { untrack } from 'svelte';
import { on } from 'svelte/events';
import { useTheme } from '../Theme/theme.state.svelte.js';
import { getDeepActiveElement } from '$lib/utils/focus.js';
import type { OpenChangeInit } from '$lib/utils/openChange.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { isRestoringFocus } from '$lib/utils/useFocusScope.svelte.js';
import type { TooltipOptions } from './tooltip.props.js';
import { requestTooltipChange, watchTooltipContentHover } from './tooltip.surface.js';

const FOCUSABLE =
	'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

/**
 * Least time, in milliseconds, a tooltip with hoverable content stays open after the pointer
 * leaves its trigger, so the pointer can cross the gap to the content.
 */
export const TOOLTIP_CONTENT_GRACE = 100;

/** Whether the focus that just arrived shows a focus ring (keyboard focus, not a click or a tap). */
const showsFocusRing = (target: EventTarget | null) => {
	if (!(target instanceof Element)) return true;
	try {
		return target.matches(':focus-visible');
	} catch {
		// An engine without `:focus-visible` gets the tooltip on any focus, as it always did.
		return true;
	}
};

export const tooltip = (props: TooltipOptions) => {
	const theme = useTheme();
	let refElement: HTMLElement | null = null;
	// A press closes the tooltip and keeps it closed until the pointer leaves or focus moves on.
	let pressed = false;
	// Focus that comes back with the window is not the user moving focus onto the trigger.
	let windowReturning = false;
	let overContent = false;
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	const clearHideTimer = () => {
		if (hideTimer !== null) clearTimeout(hideTimer);
		hideTimer = null;
	};

	const show = (init: OpenChangeInit) => {
		const ref = refElement;
		clearHideTimer();
		if (!ref || props.disabled || pressed) return;
		requestTooltipChange(theme, { ...props, ref }, init);
	};
	const hide = (init: OpenChangeInit) => {
		clearHideTimer();
		const ref = refElement;
		if (!ref || theme.tooltip?.ref !== ref) return;
		requestTooltipChange(theme, null, init);
	};

	// The pointer left the trigger or its content. Content that can be hovered keeps the tooltip
	// open for a moment so the pointer can reach it; a re-entry or the next tooltip cancels or
	// replaces the close, and the warm-up window for the next hover starts right now.
	const scheduleHide = (init: OpenChangeInit) => {
		clearHideTimer();
		const ref = refElement;
		if (!ref || theme.tooltip?.ref !== ref) return;
		theme.hoverIntent.markClosed();
		const closeDelay = Math.max(0, props.closeDelay ?? 0);
		const delay =
			props.hoverable === false ? closeDelay : Math.max(closeDelay, TOOLTIP_CONTENT_GRACE);
		if (delay === 0) {
			hide(init);
			return;
		}
		hideTimer = setTimeout(() => {
			hideTimer = null;
			if (overContent || hoverAction.isHovered) return;
			hide(init);
		}, delay);
	};

	const hoverAction = useHoverAction({
		isActive: () => !props.disabled,
		onMouseEnter: (event) => {
			show({ reason: 'trigger-hover', event, interaction: 'mouse' });
		},
		onMouseLeave: (event) => {
			pressed = false;
			scheduleHide({ reason: 'trigger-hover', event, interaction: 'mouse' });
		},
		get delay() {
			return props.delay ?? 400;
		},
		// Right after another tooltip, hover card or hover popover, the next tooltip shows at once.
		// TooltipHost reports the shared surface's closes to the group.
		group: () => theme.hoverIntent,
		// A tooltip often explains why its trigger is disabled.
		skipDisabled: false
	});

	return (ref: HTMLElement) => {
		refElement = ref;
		// Keyboard users reach the tooltip by focusing its trigger, so an element the browser
		// cannot focus (an icon, a badge, a truncated label) joins the tab order.
		if (!ref.matches(FOCUSABLE)) ref.tabIndex = 0;
		const off = hoverAction.reference?.(ref);
		const press = (event: Event) => {
			if (props.closeOnClick === false) return;
			pressed = true;
			hoverAction.cancel();
			hide({ reason: 'trigger-press', event });
		};
		const win = ref.ownerDocument.defaultView;
		let windowFocusTimer: ReturnType<typeof setTimeout> | null = null;
		const offs = [
			// A new hover on the trigger ends the wait to close and the press that closed it.
			on(ref, 'mouseenter', () => {
				clearHideTimer();
			}),
			on(ref, 'pointerenter', (event) => {
				if (event.pointerType !== 'touch') pressed = false;
			}),
			on(ref, 'pointerdown', (event) => {
				// A touch never opens a tooltip, so there is nothing to close, and the press that
				// follows is not a pointer leaving.
				if (event.pointerType === 'touch' || event.button !== 0) return;
				press(event);
			}),
			// Enter or Space on a focused trigger: a click with no pointer behind it.
			on(ref, 'click', (event) => {
				if (event.detail === 0) press(event);
			}),
			// Keyboard users get the tooltip on focus when the focus ring shows; a click, a tap, focus
			// the page gave back (a closing dialog) or the window returning do not open it. Screen
			// readers get the text through aria-describedby.
			on(ref, 'focusin', (event) => {
				if (windowReturning || isRestoringFocus() || !showsFocusRing(event.target)) return;
				show({ reason: 'trigger-focus', event, interaction: 'keyboard' });
			}),
			on(ref, 'focusout', (event) => {
				pressed = false;
				hide({ reason: 'trigger-focus', event, interaction: 'keyboard' });
			}),
			watchTooltipContentHover(ref, (inside, event) => {
				overContent = inside;
				if (inside) clearHideTimer();
				else if (!hoverAction.isHovered)
					scheduleHide({ reason: 'trigger-hover', event, interaction: 'mouse' });
			})
		];
		if (win) {
			offs.push(
				on(win, 'blur', () => {
					if (getDeepActiveElement(ref.ownerDocument) === ref) windowReturning = true;
				}),
				on(win, 'focus', () => {
					// The trigger's own `focusin` for the return arrives around this event.
					if (windowFocusTimer !== null) clearTimeout(windowFocusTimer);
					windowFocusTimer = setTimeout(() => {
						windowFocusTimer = null;
						windowReturning = false;
					});
				})
			);
		}
		$effect(() => {
			if (!props.disabled) return;
			untrack(() => {
				pressed = false;
				hide({ reason: 'imperative-action' });
			});
		});
		$effect(() => {
			const active = theme.tooltip?.ref === ref && theme.tooltipId;
			if (!active) return;
			const previous = ref.getAttribute('aria-describedby');
			ref.setAttribute('aria-describedby', theme.tooltipId!);
			return () => {
				if (previous === null) ref.removeAttribute('aria-describedby');
				else ref.setAttribute('aria-describedby', previous);
			};
		});
		return () => {
			off?.();
			offs.forEach((stop) => stop());
			clearHideTimer();
			if (windowFocusTimer !== null) clearTimeout(windowFocusTimer);
			hoverAction.destroy();
			if (theme.tooltip?.ref === ref) theme.tooltip = null;
			if (refElement === ref) refElement = null;
		};
	};
};
