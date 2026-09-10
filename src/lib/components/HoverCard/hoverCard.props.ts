import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { CardProps, CardThemeProps } from '../Card/index.js';
import type { PopoverProps, PopoverThemeProps } from '../Popover/index.js';
import type { HoverCardThemeProps } from './hoverCard.theme.js';

export type HoverCardPayload = {
	/** Stable DOM id used by the underlying popover surface. */
	id: string;
	/** Whether the hover card is currently open. */
	isOpen: boolean;
	/** Opens the hover card immediately, bypassing the open delay. */
	open: () => void;
	/** Closes the hover card immediately, bypassing the close delay. */
	close: () => void;
	/** Toggles the hover card immediately. */
	toggle: () => void;
};

export type HoverCardTrigger = Slot<HoverCardPayload> | (ButtonProps & { content?: string });

export type HoverCardProps = WithAttachments<{
	/** Stable DOM id for the underlying popover root; falls back to a generated id. */
	id?: string;
	/** Controls whether the hover card is open; bindable for two-way control. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/** Trigger content. Strings and snippets are wrapped; ButtonProps render a Button. */
	trigger?: HoverCardTrigger;
	/** Main card content. Alias for children, useful when mirroring other hover-card APIs. */
	content?: Slot<HoverCardPayload>;
	/** Main card content. Receives the hover card payload when rendered as a snippet. */
	children?: Slot<HoverCardPayload>;
	/** Card title rendered through the Card title slot. */
	title?: Slot<HoverCardPayload>;
	/** Card description rendered through the Card description slot. */
	description?: Slot<HoverCardPayload>;
	/** Card footer rendered through the Card footer slot. */
	footer?: Slot<HoverCardPayload>;
	/** Preferred placement relative to the trigger. */
	position?: PopoverProps['position'];
	/** Gap in pixels between the trigger and the card. */
	offset?: PopoverProps['offset'];
	/** Opens after this many milliseconds on pointer enter or focus. */
	delay?: number;
	/** Closes after this many milliseconds on pointer leave or focus out. */
	closeDelay?: number;
	/** When true, focus entering the trigger or card opens it. */
	openOnFocus?: boolean;
	/** When true, clicking the trigger toggles the card. */
	openOnClick?: boolean;
	/** When true, pressing Escape closes the card. */
	closeOnEscape?: PopoverProps['closeOnEscape'];
	/** When true, clicking outside closes the card. */
	closeOnClickOutside?: PopoverProps['closeOnClickOutside'];
	/** When true, enter and exit transitions slide from the placement direction. */
	directedTransition?: PopoverProps['directedTransition'];
	/** Fly/scale opacity transition overrides passed to Popover. */
	transition?: PopoverProps['transition'];
	/** Visual size shared by the Popover panel and Card surface. */
	size?: Sizes;
	/** Spacing density applied to the inner Card. */
	density?: Density;
	/** When true, prevents hover, focus, and click opening. */
	disabled?: boolean;
	/** Additional CSS classes merged onto the Card surface. */
	class?: string;
	/** Additional CSS classes merged onto the trigger wrapper. */
	triggerClass?: string;
	/** Additional CSS classes merged onto the transparent Popover panel. */
	popoverClass?: string;
	/** Theme color token applied to the inner Card. */
	cardColor?: CardProps['color'];
	/** Visual variant applied to the inner Card. */
	cardVariant?: CardProps['variant'];
	/** Show subtle borders between Card sections. */
	showBorders?: CardProps['showBorders'];
	/** Called once when the library requests an open-state change. */
	onOpenChange?: (open: boolean) => void;
	/** Callback after the open transition finishes. */
	onAfterOpen?: (hoverCard: HoverCardPayload) => void;
	/** Callback after the close transition finishes. */
	onAfterClose?: (hoverCard: HoverCardPayload) => void;
	/** Theme overrides for HoverCard wrapper parts. */
	theme?: HoverCardThemeProps;
	/** Theme overrides for the inner Card. */
	cardTheme?: CardThemeProps;
	/** Theme overrides for the underlying Popover. */
	popoverTheme?: PopoverThemeProps;
}>;
