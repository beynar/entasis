import type { Placement } from '@floating-ui/dom';
import type { Snippet } from 'svelte';
import { useTheme } from '../Theme/theme.state.svelte.js';
import { useHoverAction } from '$lib/utils/useHoverAction.svelte.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { TooltipThemeProps } from './tooltip.theme.js';

export type TooltipProps = {
	/** Typography, icon, and surface geometry scale. */
	size?: Sizes;
	/** Classes applied to the tooltip surface. */
	class?: string;
	/** Text or snippet displayed inside the tooltip. */
	content: string | Snippet;
	/** Preferred placement relative to the attached element. */
	position?: Placement;
	/** Semantic palette role for the tooltip surface. */
	color?: Colors;
	/** Tooltip surface treatment. */
	variant?: 'solid' | 'outline' | 'soft';
	/** Hover delay in milliseconds; zero shows immediately. Defaults to 400. */
	delay?: number;
	/** Gap from the attached element in pixels. */
	offset?: number;
	/** Opening and closing transition overrides. */
	transition?: FSOProps;
	/** Theme overrides for the tooltip surface. */
	theme?: TooltipThemeProps;

	/** Called after the opening transition completes. */
	onAfterOpen?: () => void;
	/** Called after the closing transition completes. */
	onAfterClose?: () => void;
};
export const tooltip = (props: TooltipProps) => {
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

	return (ref: HTMLElement) => {
		refElement = ref;
		const off = hoverAction.reference?.(ref);
		return () => {
			off?.();
			hoverAction.destroy();
			if (theme.tooltip?.ref === ref) {
				theme.tooltip = null;
				theme.lastTooltipClosed = Date.now();
			}
			if (refElement === ref) refElement = null;
		};
	};
};
