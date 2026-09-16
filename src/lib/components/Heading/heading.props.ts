import type { Snippet } from 'svelte';
import type { WithAttachments } from '$lib/types/props.js';
import type { HeadingThemeProps } from './heading.theme.js';

export type HeadingProps = WithAttachments<{
	/**
	 * Additional CSS classes merged onto the root heading element.
	 */
	class?: string;
	/**
	 * Snippet rendered as the heading text content.
	 */
	children?: Snippet;
	/**
	 * Visual size level (h1–h6); sets `data-level` and the default semantic element.
	 */
	size?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
	/**
	 * Semantic HTML heading element to render, overriding the default derived from `size`.
	 */
	as?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
	/**
	 * Font weight of the heading text.
	 */
	weight?: 'normal' | 'bold' | 'light';
	/**
	 * Text cap trimming along the start, end, or both edges, exposed as `data-trim`.
	 */
	trim?: 'end' | 'both' | 'start' | 'none';
	/**
	 * Horizontal text alignment of the heading.
	 */
	align?: 'left' | 'center' | 'right';
	/**
	 * When true, applies the balanced variant for improved multi-line line breaks.
	 */
	balanced?: boolean;
	/**
	 * When true, applies underline decoration to the heading.
	 */
	underline?: boolean;
	/**
	 * When true, applies the muted variant for secondary heading emphasis.
	 */
	muted?: boolean;
	/**
	 * Per-instance theme overrides merged over the resolved Heading theme.
	 */
	theme?: HeadingThemeProps;
}>;
