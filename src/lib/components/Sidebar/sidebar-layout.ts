import { cx } from '$lib/utils/cva/index.js';
import type { SidebarFrame, SidebarSide, SidebarVariant } from './sidebar.props.js';

// `--sidebar-activity-offset` is the activity bar's reserved thickness, or `0px` when there is
// no activity bar. Folding it into the spacer width and the container inset keeps both layouts
// on one set of classes instead of a second pass of `group-data-[activity-bar]` variants.
export function getSidebarGapClass(variant: SidebarVariant) {
	const hasInlineInset = variant === 'floating' || variant === 'split';

	return cx(
		'relative w-[calc(var(--sidebar-width)+var(--sidebar-activity-offset,0px))] bg-transparent transition-[width] duration-normal ease-linear group-data-[width-prehydrating=true]/sidebar-wrapper:!transition-none group-data-[resizing=true]:!transition-none group-data-[collapsible=offcanvas]:w-[var(--sidebar-activity-offset,0px)]',
		hasInlineInset
			? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem+var(--sidebar-activity-offset,0px))]'
			: 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--sidebar-activity-offset,0px))]',
		// A hover peek overlays the page, so the reserved column must stay at its icon width.
		hasInlineInset
			? 'group-data-[peek=true]:!w-[calc(var(--sidebar-width-icon)+1rem+var(--sidebar-activity-offset,0px))]'
			: 'group-data-[peek=true]:!w-[calc(var(--sidebar-width-icon)+var(--sidebar-activity-offset,0px))]'
	);
}

function getContainerGeometryClass(variant: SidebarVariant) {
	if (variant === 'admin' || variant === 'framed') {
		return 'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]';
	}
	if (variant === 'inset') {
		return 'py-2 group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]';
	}
	return 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]';
}

export function getSidebarContainerClass(
	side: SidebarSide,
	variant: SidebarVariant,
	isEdgeRevealed: boolean,
	frame: SidebarFrame
) {
	const panelOwnsShadow = variant === 'floating' || variant === 'split';

	return cx(
		'inset-y-0 z-10 hidden w-[var(--sidebar-width)] bg-transparent transition-[left,right,width] duration-normal ease-linear group-data-[width-prehydrating=true]/sidebar-wrapper:!transition-none group-data-[resizing=true]:!transition-none md:flex',
		frame === 'viewport' ? 'fixed h-window' : 'absolute h-full',
		// The offcanvas offset slides the panel away relative to itself: the activity bar keeps
		// its own inset, so it never leaves the screen with the panel. Floating and split park it
		// fully past the edge instead: their rail stands in a gutter, and a panel parked under it
		// would show through that gutter.
		side === 'left'
			? cx(
					'left-[var(--sidebar-activity-offset,0px)]',
					panelOwnsShadow
						? 'group-data-[collapsible=offcanvas]:-left-[var(--sidebar-width)]'
						: 'group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-activity-offset,0px)-var(--sidebar-width))]'
				)
			: cx(
					'right-[var(--sidebar-activity-offset,0px)]',
					panelOwnsShadow
						? 'group-data-[collapsible=offcanvas]:-right-[var(--sidebar-width)]'
						: 'group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-activity-offset,0px)-var(--sidebar-width))]'
				),
		getContainerGeometryClass(variant),
		// Hover peek: full width over the page, lifted so it reads as a temporary drawer. The
		// elevation itself belongs to the panel (see `getSidebarPanelPeekClass`), not to this
		// transparent wrapper with its padding gutter.
		'group-data-[peek=true]:z-40 group-data-[peek=true]:!w-[var(--sidebar-width)]',
		isEdgeRevealed && 'z-40',
		isEdgeRevealed && !panelOwnsShadow && 'shadow-xl',
		// Inset keeps a vertical gutter so the resting column sits level with the page card. An
		// edge reveal overlays the page instead, so the peek runs the full height like any other
		// temporary drawer rather than floating 0.5rem short of the top and bottom edges.
		isEdgeRevealed && variant === 'inset' && '!py-0',
		side === 'left' && isEdgeRevealed && '!left-[var(--sidebar-activity-offset,0px)]',
		side === 'right' && isEdgeRevealed && '!right-[var(--sidebar-activity-offset,0px)]'
	);
}

/**
 * Elevation for the panel while a hover peek renders it over the page. Floating and split
 * panels already own a border and shadow, exactly as the edge-reveal path leaves them alone.
 */
export function getSidebarPanelPeekClass(variant: SidebarVariant) {
	const panelOwnsShadow = variant === 'floating' || variant === 'split';
	return panelOwnsShadow ? undefined : 'group-data-[peek=true]:raised-3';
}

/**
 * Fixed/absolute placement for the activity bar column, pinned outside the panel. The column is
 * the reserved offset, and it takes the panel container's gutters so the rail lines up with the
 * panel beside it: none for admin and framed, a vertical one for inset, the outer and vertical
 * ones for floating and split (the panel's own gutter spaces the pair).
 */
export function getSidebarActivityBarContainerClass(
	side: SidebarSide,
	frame: SidebarFrame,
	variant: SidebarVariant
) {
	return cx(
		'inset-y-0 z-30 hidden w-[var(--sidebar-activity-offset,3rem)] md:flex',
		frame === 'viewport' ? 'fixed h-window' : 'absolute h-full',
		side === 'left' ? 'left-0' : 'right-0',
		variant === 'inset' && 'py-2',
		(variant === 'floating' || variant === 'split') && (side === 'left' ? 'py-2 pl-2' : 'py-2 pr-2')
	);
}
