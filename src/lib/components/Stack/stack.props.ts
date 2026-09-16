import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { LayoutRootAttributes } from '../Layout/layoutAttributes.js';
import type { LayoutSpacing } from '../Layout/layoutSpacing.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { StackThemeProps } from './stack.theme.js';

export type StackOrientation = 'horizontal' | 'vertical';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type StackWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
/**
 * Elements the stack root may render. `ul`, `ol` and `li` are deliberately absent: the root always
 * contains exactly one `<div data-slot="stack-layout">` (a container query cannot style its own
 * container), and the content model of `ul`/`ol` admits only `li`, `script` and `template`. Write
 * the list yourself and put a stack inside each `<li>` when its content needs a flex line.
 */
export type StackElement =
	| 'div'
	| 'span'
	| 'section'
	| 'article'
	| 'aside'
	| 'main'
	| 'nav'
	| 'header'
	| 'footer'
	| 'form'
	| 'fieldset';
export type StackSizeValue = number | string;

export type StackProps = WithAttachments<
	WithSlot<
		LayoutRootAttributes & {
			/** Bindable reference to the root element. */
			ref?: HTMLElement | null;
			/** Additional classes merged onto the root element. */
			class?: string;
			/**
			 * Semantic container element rendered by the stack root. Lists are not available —
			 * see {@link StackElement}. @default 'div'
			 */
			as?: StackElement;
			/**
			 * Flex direction. `'horizontal'` lays children out in a row, `'vertical'` in a column.
			 * Responsive: a plain value or a per-breakpoint record. The
			 * breakpoints measure the stack's OWN width, not the viewport's. @default 'vertical'
			 */
			orientation?: ResponsiveProps<StackOrientation>;
			/** Cross-axis alignment (`align-items`). Responsive. @default 'stretch' */
			align?: ResponsiveProps<StackAlign>;
			/** Main-axis alignment (`justify-content`). Responsive. @default 'start' */
			justify?: ResponsiveProps<StackJustify>;
			/**
			 * Spacing between children on the active theme spacing scale. Responsive.
			 * @default 'none'
			 */
			gap?: ResponsiveProps<LayoutSpacing>;
			/** Padding on both axes. Axis-specific values take precedence. */
			padding?: LayoutSpacing;
			/** Inline-axis padding, overriding `padding` for that axis. */
			paddingInline?: LayoutSpacing;
			/** Block-axis padding, overriding `padding` for that axis. */
			paddingBlock?: LayoutSpacing;
			/** Controls whether children wrap onto additional lines. Responsive. @default 'nowrap' */
			wrap?: ResponsiveProps<StackWrap>;
			/** Enables native overflow scrolling. */
			scrollable?: boolean;
			/** Explicit width. Numbers are interpreted as pixels. */
			width?: StackSizeValue;
			/** Explicit height. Numbers are interpreted as pixels. */
			height?: StackSizeValue;
			/** Maximum width. Numbers are interpreted as pixels. */
			maxWidth?: StackSizeValue;
			/** Minimum height. Numbers are interpreted as pixels. */
			minHeight?: StackSizeValue;
			/** Theme overrides. */
			theme?: StackThemeProps;
		},
		'children'
	>
>;
