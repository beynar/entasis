import { useTheme } from '../Theme/theme.state.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import { on } from 'svelte/events';
import type { TooltipOptions } from './tooltip.props.js';

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
			theme.lastTooltipClosed = Date.now();
		},
		get delay() {
			const lastTooltipClosed = theme.lastTooltipClosed;
			const now = Date.now();
			if (lastTooltipClosed && now - lastTooltipClosed < (props.delay ?? 400)) {
				return 0;
			}
			return props.delay ?? 400;
		}
	});

	const show = (ref: HTMLElement) => {
		theme.tooltip = { ...props, ref };
	};
	const hide = (ref: HTMLElement) => {
		if (theme.tooltip?.ref !== ref) return;
		theme.tooltip = null;
		theme.lastTooltipClosed = Date.now();
	};

	return (ref: HTMLElement) => {
		refElement = ref;
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
			if (theme.tooltip?.ref === ref) {
				theme.tooltip = null;
				theme.lastTooltipClosed = Date.now();
			}
			if (refElement === ref) refElement = null;
		};
	};
};
