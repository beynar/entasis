import type { Sizes } from '$lib/types/theme.js';
import type { WithSlot, Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { CollapsibleThemeProps } from './collapsible.theme.js';

type CollapsibleBaseProps = {
	/**
	 * Bindable reference to the root collapsible container element.
	 */
	ref?: HTMLElement | null;
	/**
	 * The class name of the collapsible container.
	 */
	class?: string;
	/**
	 * Current open state. Bindable.
	 */
	open?: boolean;
	/**
	 * Initial open state when `open` is omitted.
	 */
	defaultOpen?: boolean;
	/**
	 * Whether the collapsible is disabled.
	 */
	disabled?: boolean;
	/**
	 * Callback fired when the open state changes.
	 */
	onOpenChange?: ((open: boolean) => void) | null | undefined;
	/**
	 * Size variant of the collapsible.
	 */
	size?: Sizes;
	/**
	 * The icon to display. `caret`/`chevron` rotate a chevron; `math` swaps a plus/minus.
	 * Pass a Slot for a custom icon (receives `{ open }`), or `false` to hide it.
	 */
	icon?: 'chevron' | 'caret' | 'math' | Slot | false;
	/**
	 * Theme configuration overrides.
	 */
	theme?: CollapsibleThemeProps;

	/**
	 * Whether the collapsible is accessible.
	 */
	accessible?: boolean;
	/**
	 * Visual variant. `default` toggles the content in and out with a slide.
	 * `peek` keeps the content mounted, clips it to `peekHeight` and fades the
	 * edge while closed, with the trigger floating as a pill over the fade.
	 */
	variant?: 'default' | 'peek';
	/**
	 * Height of the collapsed preview for the `peek` variant. A number is px.
	 */
	peekHeight?: number | string;
};

type CollapsibleSlotProps = WithSlot<
	CollapsibleBaseProps,
	'trigger' | 'children' | 'srOnlyContent',
	{ open: boolean }
>;

export type CollapsibleProps = WithAttachments<CollapsibleSlotProps>;
