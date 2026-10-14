import type { Snippet } from 'svelte';
import type { WithAttachments } from '$lib/types/props.js';
import type { ScrollAreaThemeProps } from './scrollArea.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

/** Attributes, handlers and attachments for the scrolling viewport element. */
export type ScrollAreaViewportAttributes = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children'>
>;

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
		/**
		 * Accessible name of the native scrolling viewport. Passing it makes the viewport a named
		 * `group` even when its content fits. Without it, the viewport is named "Scrollable content"
		 * (from the i18n catalog) only while it overflows and is a keyboard tab stop.
		 */
		label?: string;
		/**
		 * Role of the native scrolling viewport. Without it, the viewport is a plain element while
		 * its content fits and a `group` while it overflows (or when `label` is passed). Override
		 * it when the scroll area sits inside a structural role whose children are constrained: a
		 * grid or treegrid, say, where the viewport has to read as `rowgroup`. Inside a listbox,
		 * pass `presentation`: the viewport then never takes a name or a tab stop, even while it
		 * overflows, because the listbox owns keyboard scrolling.
		 */
		viewportRole?: string;
		/**
		 * Attributes spread onto the scrolling viewport, for a widget that makes the viewport itself
		 * its semantic element: a listbox with `role`, `aria-activedescendant` and its own `id`,
		 * say. They are merged with the viewport's own, and win over them: `class` is added to the
		 * viewport's classes, and `onscroll`, `onfocus` and `onblur` run before the built-in
		 * handling. A `role` here hands the viewport's semantics to the caller: the viewport then
		 * takes neither the automatic "Scrollable content" name nor the automatic tab stop, so pass
		 * `tabindex` (and a name) when the role needs them.
		 */
		viewportAttrs?: ScrollAreaViewportAttributes;
		/**
		 * Controls when the scrollbars are shown. `hover` shows them while the pointer is over the
		 * area or the area is scrolling (so touch scrolling, which never hovers, still reveals them),
		 * `always` and `auto` whenever the content overflows, `scroll` only while scrolling.
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
		 * Px of content that may stay hidden past an edge before `data-overflow-*-start` and
		 * `data-overflow-*-end` (and the `scrollOnEdges` arrows) count it. A fractional zoom level
		 * leaves a remainder below one px at the scroll end, which must not read as more content.
		 * @default 1
		 */
		overflowEdgeThreshold?: number;
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
