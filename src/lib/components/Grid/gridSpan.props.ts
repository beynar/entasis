import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { LayoutRootAttributes } from '../Layout/layoutAttributes.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { GridSpanThemeProps } from './gridSpan.theme.js';

/** Columns a GridSpan covers: a positive integer span, or the whole row. */
export type GridSpanColumns = number | 'full';

export type GridSpanProps = WithAttachments<
	WithSlot<
		LayoutRootAttributes<HTMLDivElement> & {
			/** Bindable reference to the root span element. */
			ref?: HTMLDivElement | null;
			/** Additional classes merged onto the root span element. */
			class?: string;
			/**
			 * Columns to span, or `full` for the complete row — per breakpoint of the Grid the
			 * span sits in, so `{ xs: 'full', md: 2 }` is a full row until that grid is 42rem wide.
			 */
			columns?: ResponsiveProps<GridSpanColumns>;
			/** Implicit grid rows to span, per breakpoint of the Grid the span sits in. */
			rows?: ResponsiveProps<number>;
			/** Theme overrides for the grid span root. */
			theme?: GridSpanThemeProps;
		},
		'children'
	>
>;
