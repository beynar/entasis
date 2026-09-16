import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { TableOfContentsThemeProps } from './tableOfContents.theme.js';

export type TableOfContentsLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TableOfContentsDensity = number | Density;

export type TableOfContentsMarkerVisibility = boolean | 'active' | 'always';

export type TableOfContentsActivationThresholds = {
	/** Inset from both viewport edges used when no clipping ancestor contains the headings. */
	viewportInset?: number;
	/** Inset from each clipping scroll-root edge used to define its active region. */
	scrollRootInset?: number;
	/** Distance below the active region's top edge used to resolve the current heading between sections. */
	currentOffset?: number;
};

export type TableOfContentsTarget = string | HTMLElement | null;

export type TableOfContentsItem = {
	/** Heading id used by the native anchor link. */
	id: string;
	/** Semantic heading level. */
	level: TableOfContentsLevel;
	/** Normalized text extracted from the heading. */
	title: string;
};

export type TableOfContentsProps = WithAttachments<{
	/** Bindable reference to the root navigation element. */
	ref?: HTMLElement | null;
	/** CSS selector or element used for heading discovery and visibility tracking. */
	target?: TableOfContentsTarget;
	/** Explicit navigation data. When provided, it takes precedence over heading discovery. */
	items?: readonly TableOfContentsItem[];
	/** Heading levels included in document order. */
	levels?: readonly TableOfContentsLevel[];
	/** Thresholds controlling the active region and current-heading fallback. Defaults to 96px, 16px, and 48px. */
	activationThresholds?: TableOfContentsActivationThresholds;
	/** Optional anchor landing offset in pixels. Applies through scroll-margin-block-start on matched headings. */
	scrollOffset?: number;
	/** Row density preset or numeric density factor. */
	density?: TableOfContentsDensity;
	/** Size token controlling typography and coordinated rail geometry. */
	size?: Sizes;
	/** Shows the continuous measured rail path. */
	showRail?: boolean;
	/** Controls marker visibility. True is an alias for active-only; false hides every marker. */
	showMarkers?: TableOfContentsMarkerVisibility;
	/** Shows lateral title connectors and uses the extended connector gutter. */
	showConnectors?: boolean;
	/** Base horizontal indentation added for each deeper heading level before size scaling. */
	indentSize?: number;
	/** Base maximum corner radius used when the rail changes depth before size scaling. */
	indentRadius?: number;
	/** Semantic color token used by highlighted titles, rail segments, and markers. */
	color?: Colors;
	/** Accessible label for the navigation landmark. */
	label?: string;
	/** CSS classes applied to the root navigation element. */
	class?: string;
	/** Theme overrides for the table-of-contents parts. */
	theme?: TableOfContentsThemeProps;
}>;
