import type { PopoverApi } from './popover.api.js';
import { usePopoverContext as usePopoverStateContext } from './popover.state.svelte.js';

export { default as Popover } from './Popover.svelte';
export type {
	PopoverOpenReason,
	PopoverPlacement,
	PopoverProps,
	PopoverSide
} from './popover.props.js';
export type { PopoverApi } from './popover.api.js';
export type { FocusOnClose } from '$lib/utils/useFocusScope.svelte.js';
export {
	popoverTheme,
	setPopoverTheme,
	usePopoverTheme,
	type PopoverTheme,
	type PopoverThemeProps
} from './popover.theme.js';
export type { PopoverPlacementState } from './popover.state.svelte.js';

/** @deprecated Renamed `PopoverApi`, the narrow popover snippets receive; kept for one minor. */
export type PopoverState<Payload = unknown> = PopoverApi<Payload>;

/** The nearest enclosing popover, or `null` outside one. */
export const usePopoverContext: () => PopoverApi | null = usePopoverStateContext;
