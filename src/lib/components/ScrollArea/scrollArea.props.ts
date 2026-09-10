import type { Snippet } from 'svelte';
import type { WithAttachments } from '$lib/types/props.js';
import type { ScrollAreaThemeProps } from './scrollArea.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

type ScrollAreaRootAttributes = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'class' | 'onscroll'
>;

export type ScrollAreaProps = WithAttachments<
	ScrollAreaRootAttributes & {
		/** Bindable reference to the root scroll-area element. */
		ref?: HTMLDivElement | null;
		/** Bindable reference to the native scrolling viewport. */
		viewportRef?: HTMLDivElement | null;
		/** Accessible label applied to the native scrolling viewport. */
		ariaLabel?: string;
		/**
		 * Controls when the vertical scrollbar is shown (`hover`, `always`, `scroll`, or `auto`).
		 * @default 'hover'
		 */
		type?: 'auto' | 'always' | 'scroll' | 'hover';
		/**
		 * Enables auto-scroll and up/down indicators when the pointer rests near the viewport edges.
		 * @default false
		 */
		scrollOnEdges?: boolean;
		/**
		 * Applies the shared scroll-fade utility to the scrollable viewport.
		 * @default false
		 */
		scrollFade?: boolean;
		/**
		 * Milliseconds to wait before hover mode treats the scroll area as hovered.
		 * @default 0
		 */
		delay?: number;
		/** Native scroll handler attached to the viewport. */
		onscroll?: (event: Event & { currentTarget: HTMLDivElement }) => void;
		/** Content rendered inside the scrollable viewport. */
		children?: Snippet;
		/** Class name applied to the root scroll area element. */
		class?: string;
		/** Theme overrides for the scroll area, viewport, scrollbar, and thumb. */
		theme?: ScrollAreaThemeProps;
	}
>;
