import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { SliderProps } from '$lib/components/Form/Slider/slider.props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { PopoverProps } from '../Popover/popover.props.js';
import type { MediaVolumeControlThemeProps } from './mediaVolumeControl.theme.js';

export type MediaVolumeControlMode = 'popover' | 'inline';
export type MediaVolumeControlOrientation = 'horizontal' | 'vertical';

export type MediaVolumeControlButtonPayload = {
	label: string;
	icon: Slot;
	active: boolean;
	pressed: boolean;
	disabled: boolean;
	activate: () => void;
};

export type MediaVolumeControlTriggerPayload = MediaVolumeControlButtonPayload & {
	isOpen: boolean;
	reference: Attachment<HTMLElement>;
	ariaHaspopup: 'dialog';
	ariaExpanded: boolean;
};

export type MediaVolumeControlProps = {
	/** Current media volume from 0 to 1. */
	volume: number;
	/** Current muted state. A volume of 0 is also treated as effectively muted. */
	muted: boolean;
	/** Callback receiving the next media volume from 0 to 1. */
	onVolumeChange: (volume: number) => void;
	/** Callback used when the mute/unmute control is pressed. */
	onToggleMuted: () => void;
	/** Render as a standalone popover control or as an inline mute + slider row. */
	mode?: MediaVolumeControlMode;
	/** Step used by the slider, expressed in media volume units from 0 to 1. */
	volumeStep?: number;
	/** Disable trigger, mute button, and slider interaction. */
	disabled?: boolean;
	/** Size forwarded to the slider and default buttons. */
	size?: Sizes;
	/** Semantic color forwarded to the slider and default active button. */
	color?: Colors;
	/** Slider orientation inside the panel. Desktop media controls commonly use vertical. */
	orientation?: MediaVolumeControlOrientation;
	/** Controlled popover open state. Only used in `popover` mode. */
	open?: boolean;
	/** Initial popover state when `open` is not provided. */
	defaultOpen?: boolean;
	/** Called once when the library requests an open-state change. */
	onOpenChange?: (open: boolean) => void;
	/** Called after the popover open transition finishes. */
	onAfterOpen?: () => void;
	/** Called after the popover close transition finishes. */
	onAfterClose?: () => void;
	/** Preferred popover placement. */
	position?: PopoverProps['position'];
	/** Popover offset from its trigger. */
	offset?: number;
	/** Popover size token. */
	popoverSize?: PopoverProps['size'];
	/** Render popover content as a mobile bottom sheet below the popover breakpoint. */
	mobileSheet?: boolean;
	/** Whether clicking the muted trigger immediately unmutes before opening. */
	unmuteOnTrigger?: boolean;
	/** Label prefix used for accessible volume labels. */
	label?: string;
	/** Icon rendered when muted or at zero volume. */
	mutedIcon?: Slot;
	/** Icon rendered below `lowVolumeThreshold`. */
	lowVolumeIcon?: Slot;
	/** Icon rendered at or above `lowVolumeThreshold`. */
	highVolumeIcon?: Slot;
	/** Volume threshold below which `lowVolumeIcon` is used. */
	lowVolumeThreshold?: number;
	/** Root class override. */
	class?: string;
	/** Popover panel class override. */
	popoverClass?: string;
	/** Panel class override. */
	panelClass?: string;
	/** Slider wrapper class override. */
	sliderClass?: string;
	/** Slider theme override. */
	sliderTheme?: SliderProps['theme'];
	/** Optional custom trigger button for `popover` mode. */
	trigger?: Snippet<[MediaVolumeControlTriggerPayload]>;
	/** Optional custom mute/unmute button inside the panel. */
	toggleButton?: Snippet<[MediaVolumeControlButtonPayload]>;
	/** Per-instance theme overrides. */
	theme?: MediaVolumeControlThemeProps;
};
