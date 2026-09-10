import type { TabbarProps, TabItem, TabAlignment, TabOrientation } from '../Tabbar/tabbar.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { TabsThemeProps } from './tabs.theme.js';
import type { Sizes, Colors } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { StepperState } from '../Stepper/stepper.state.svelte.js';
import type { TabbarThemeProps } from '../Tabbar/tabbar.theme.js';

export type TabsPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TabsRenderPayload<Item extends TabItem = TabItem> = {
	stepper: StepperState<Item>;
	item: Item;
	index: number;
};

export type TabsProps<Item extends TabItem = TabItem> = WithAttachments<{
	/**
	 * Items to render as tabs. Each item can be a simple string or an object with label, prefix, suffix, href, and disabled properties.
	 * Inherited from Tabbar component.
	 */
	items: Item[];
	/**
	 * The index of the currently active tab. This is bindable.
	 * @default 0
	 */
	value?: number;
	/** Initial active tab index when `value` is omitted. */
	defaultValue?: number;
	/**
	 * Callback function called when the active tab changes.
	 * Receives the new tab index as an argument.
	 */
	onValueChange?: (value: number) => void;
	/**
	 * The placement of the tabbar relative to the content.
	 * @default 'top'
	 */
	placement?: TabsPlacement;
	/**
	 * Additional CSS classes for the tabs container.
	 */
	class?: string;
	/**
	 * Custom theme overrides for the tabs container.
	 */
	theme?: TabsThemeProps;
	/**
	 * Bindable reference to the stepper state for programmatic control.
	 * Provides methods like next(), previous(), goTo(index).
	 */
	stepper?: StepperState<Item>;
	/**
	 * Animation configuration for tab panel transitions.
	 * @default { duration: 300, easing: 'ease-in-out', fill: 'both' }
	 */
	keyFramesOptions?: {
		/**
		 * Animation duration in milliseconds.
		 */
		duration: number;
		/**
		 * CSS timing function used for tab panel opacity and height transitions.
		 */
		easing: string;
		/**
		 * Web Animations API fill mode applied to the tab panel translation animation.
		 */
		fill: 'auto' | 'backwards' | 'both' | 'forwards' | 'none';
	};
	/**
	 * The size of the tabs.
	 * @default 'normal'
	 */
	tabbarSize?: Sizes;
	/**
	 * The orientation of the tabbar.
	 * @default 'horizontal'
	 */
	tabbarOrientation?: TabOrientation;
	/**
	 * The color scheme of the tabs.
	 * @default 'primary'
	 */
	tabbarColor?: Colors;
	/**
	 * The alignment of the tabs within the container.
	 * @default 'start'
	 */
	tabbarAlignment?: TabAlignment;
	/**
	 * Additional CSS classes for the tabbar container.
	 */
	tabbarClass?: string;
	/**
	 * Custom theme overrides for the tabbar.
	 */
	tabbarTheme?: TabbarThemeProps;
	/**
	 * Repeated panel renderer. Called once for each item.
	 */
	children?: Snippet<[TabsRenderPayload<Item>]>;
	/**
	 * Whether the tabbar should be full width.
	 * @default false
	 */
	tabbarFullWidth?: boolean;
}>;
