import { useTheme } from '../Theme/theme.state.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { on } from 'svelte/events';
import type { TooltipOptions } from './tooltip.props.js';

const FOCUSABLE =
	'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

export const tooltip = (props: TooltipOptions) => {
	const theme = useTheme();
	let refElement: HTMLElement | null = null;

	const hoverAction = useHoverAction({
		isActive: () => true,
		onMouseEnter: () => {
			if (refElement) {
				theme.tooltip = { ...props, ref: refElement };
			}
		},
		onMouseLeave: () => {
			if (theme.tooltip?.ref !== refElement) return;
			theme.tooltip = null;
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

	const show = (ref: HTMLElement) => {
		theme.tooltip = { ...props, ref };
	};
	const hide = (ref: HTMLElement) => {
		if (theme.tooltip?.ref !== ref) return;
		theme.tooltip = null;
	};

	return (ref: HTMLElement) => {
		refElement = ref;
		// Keyboard users reach the tooltip by focusing its trigger, so an element the browser
		// cannot focus (an icon, a badge, a truncated label) joins the tab order.
		if (!ref.matches(FOCUSABLE)) ref.tabIndex = 0;
		const off = hoverAction.reference?.(ref);
		// Keyboard users get the tooltip on focus; screen readers get it via aria-describedby.
		const offFocus = on(ref, 'focusin', () => show(ref));
		const offBlur = on(ref, 'focusout', () => hide(ref));
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
			offFocus();
			offBlur();
			hoverAction.destroy();
			if (theme.tooltip?.ref === ref) theme.tooltip = null;
			if (refElement === ref) refElement = null;
		};
	};
};
