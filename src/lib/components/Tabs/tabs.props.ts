import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { TabbarProps, TabItem } from '../Tabbar/tabbar.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { TabsThemeProps } from './tabs.theme.js';
import type { Snippet } from 'svelte';
import type { StepperState } from '../Stepper/stepper.state.svelte.js';
import type { StepperMount } from '../Stepper/stepper.props.js';

export type TabsPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Instance handle exposed by `bind:api` and by the repeated `children` snippet. */
export type TabsApi<Item extends TabItem = TabItem> = StepperState<Item>;

export type TabsRenderPayload<Item extends TabItem = TabItem> = {
	api: TabsApi<Item>;
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
	 * The `value` of the active tab (a string item resolves to itself; objects use `value`,
	 * else their string label, else their index). Bindable.
	 * @default the first tab's value
	 */
	value?: string;
	/** Initial active tab value when `value` is omitted. */
	defaultValue?: string;
	/**
	 * Callback function called when the active tab changes.
	 * Receives the new tab's value and item.
	 */
	onValueChange?: (payload: { value: string; item: Item; index: number }) => void;
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
	 * Bindable instance handle for programmatic control.
	 * Provides methods like next(), previous(), goTo(index).
	 */
	api?: TabsApi<Item>;
	/**
	 * Panel swap timing overrides. Only `duration` (ms) and `easing` are read; supports
	 * responsive values and wins over the `motion` theme slot.
	 */
	transition?: ResponsiveProps<FSOProps>;
	/**
	 * Props forwarded to the inner Tabbar. `orientation` falls back to the value implied by
	 * `placement` (vertical for `left`/`right`).
	 */
	tabbar?: Pick<
		TabbarProps,
		| 'size'
		| 'orientation'
		| 'color'
		| 'alignment'
		| 'class'
		| 'theme'
		| 'fullWidth'
		| 'label'
		| 'variant'
		| 'scrollFade'
	>;
	/**
	 * When each panel's content is created.
	 * `lazy` creates a panel the first time it is activated and destroys it when it is left,
	 * `once` keeps it after the first activation, `eager` creates every panel up front.
	 * Inactive panels are `hidden` and `inert` in every mode.
	 * @default 'lazy'
	 */
	mount?: StepperMount;
	/**
	 * Repeated panel renderer. Called once for each item.
	 */
	children?: Snippet<[TabsRenderPayload<Item>]>;
}>;
