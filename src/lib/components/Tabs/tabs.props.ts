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

/**
 * Why the active tab changed.
 * - `user`: a click, an arrow key, a menu entry or the `api` handle picked the tab.
 * - `initial`: on mount, `defaultValue` named a disabled or unknown tab, so the first enabled tab
 *   was selected instead.
 * - `disabled`: the selected tab became disabled, so the first enabled tab was selected.
 * - `missing`: the selected tab was removed, so the enabled tab nearest to it was selected.
 */
export type TabsValueChangeReason = 'user' | 'initial' | 'disabled' | 'missing';

/** Payload of Tabs' `onValueChange`. */
export type TabsValueChangePayload<Item extends TabItem = TabItem> = {
	/** The new active tab's value. */
	value: string;
	item: Item;
	index: number;
	/**
	 * `user` for a click, arrow key, menu entry or `api` navigation; `initial`, `disabled` or
	 * `missing` when Tabs moved the selection to an enabled tab by itself.
	 */
	reason: TabsValueChangeReason;
};

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
	 * A value you set is never rewritten: one naming a disabled tab shows that tab and its
	 * panel, and one naming no tab selects no tab and shows no panel. When the selected tab is
	 * removed or disabled, Tabs selects its nearest enabled neighbour or the first enabled tab,
	 * writes it back here and reports it through `onValueChange` with its `reason`.
	 * @default the first enabled tab's value
	 */
	value?: string;
	/**
	 * Initial active tab value when `value` is omitted. One that names a disabled or unknown
	 * tab selects the first enabled tab on mount, reported with reason `initial`.
	 */
	defaultValue?: string;
	/**
	 * Called once per change of the active tab with `{ value, item, index, reason }`.
	 * Not called when the current tab is re-selected or when `value` is changed externally.
	 */
	onValueChange?: (payload: TabsValueChangePayload<Item>) => void;
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
	 * Provides methods like next(), previous(), goTo(index). `next` and `previous` step over
	 * disabled tabs; `goTo` a disabled tab does nothing.
	 */
	api?: TabsApi<Item>;
	/**
	 * Panel swap timing overrides. Only `duration` (ms) and `easing` are read; supports
	 * responsive values and wins over the `motion` theme slot.
	 */
	transition?: ResponsiveProps<FSOProps>;
	/**
	 * Props forwarded to the inner Tabbar. `orientation` falls back to the value implied by
	 * `placement` (vertical for `left`/`right`). `activateOnFocus: false` switches to manual
	 * activation: the arrow keys only move focus, and Enter, Space or a click opens the tab, so
	 * arrowing across the list does not mount every lazy panel on the way.
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
		| 'activateOnFocus'
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
