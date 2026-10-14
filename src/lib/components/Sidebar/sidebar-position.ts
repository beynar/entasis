import type {
	PopoverLogicalSide,
	PopoverPlacement
} from '$lib/components/Popover/popover.props.js';
import type { Direction } from '$lib/utils/useDirection.svelte.js';
import type { SidebarMenuAlign, SidebarMenuSide, SidebarSide } from './sidebar.props.js';

/**
 * The side of a desktop sidebar's rows that faces the page, as a logical side. The sidebar's
 * layout follows the reading direction (`side="left"` is the start edge: the left in
 * left-to-right, the right in right-to-left), so the page is at the inline end of a `left`
 * sidebar and at the inline start of a `right` one.
 */
export const sidebarInwardSide = (side: SidebarSide | undefined): PopoverLogicalSide =>
	side === 'right' ? 'inline-start' : 'inline-end';

/**
 * `sidebarInwardSide` resolved to a physical side, for placements that take only physical
 * sides (tooltips).
 */
export const sidebarInwardPhysicalSide = (
	side: SidebarSide | undefined,
	direction: Direction
): 'left' | 'right' =>
	(sidebarInwardSide(side) === 'inline-end') === (direction === 'ltr') ? 'right' : 'left';

type SidebarMenuPositionContext = {
	/** The mobile drawer: menus open below their row. */
	isMobile: boolean;
	/** The edge the sidebar sits on. Default `'left'`. */
	side?: SidebarSide;
};

/**
 * The Popover placement of a row's menu. An explicit `menuSide` wins, physical (`right`) or
 * logical (`inline-end`, resolved against the reading direction by Popover). Without one, a
 * desktop menu opens toward the page (`inline-end` of a left sidebar, `inline-start` of a right
 * one) and a mobile menu below its row.
 */
export function getSidebarMenuPosition(
	menuSide: SidebarMenuSide | undefined,
	align: SidebarMenuAlign | undefined,
	{ isMobile, side }: SidebarMenuPositionContext
): PopoverPlacement {
	const resolvedSide = menuSide ?? (isMobile ? 'bottom' : sidebarInwardSide(side));
	const resolvedAlign = align ?? (isMobile ? 'end' : 'start');
	if (resolvedAlign === 'center') return resolvedSide;
	return `${resolvedSide}-${resolvedAlign}` as PopoverPlacement;
}
