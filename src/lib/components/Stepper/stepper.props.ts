import type { Snippet } from 'svelte';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { StepperState } from './stepper.state.svelte.js';
import type { StepperThemeProps } from './stepper.theme.js';

/** Instance handle exposed by `bind:api` and by the repeated `children` snippet. */
export type StepperApi<Item> = StepperState<Item>;

export type StepperRenderPayload<Item> = {
	api: StepperApi<Item>;
	item: Item;
	index: number;
};

export type StepperValueChangePayload<Item> = {
	value: number;
	item: Item;
	index: number;
};

export type StepperPanelAriaLabelledby<Item> =
	string | false | ((payload: StepperRenderPayload<Item>) => string | undefined);

export type StepperPanelAriaLabel<Item> =
	string | ((payload: StepperRenderPayload<Item>) => string | undefined);

/**
 * When a step's content is created: `lazy` on first activation and destroyed when left,
 * `once` on first activation and kept, `eager` for every step up front.
 */
export type StepperMount = 'eager' | 'lazy' | 'once';

export type StepperProps<Item> = {
	/**
	 * Data for each step, passed to the repeated children snippet as `item`.
	 */
	items: Item[];
	/**
	 * Repeated panel renderer. Called once for each item.
	 */
	children?: Snippet<[StepperRenderPayload<Item>]>;
	/**
	 * Called once when the active step changes. Receives the same named payload as
	 * Tabs: the new step index as `value`, its `item`, and its `index`.
	 */
	onValueChange?: (payload: StepperValueChangePayload<Item>) => void;
	/**
	 * Additional CSS classes for the root stepper container.
	 */
	class?: string;
	/**
	 * Zero-based index of the currently visible step. Bindable.
	 */
	value?: number;
	/** Initial active step index when `value` is omitted. */
	defaultValue?: number;
	/**
	 * Bindable instance handle for programmatic navigation (`next`, `previous`, `goTo`).
	 */
	api?: StepperApi<Item>;
	/**
	 * Step translation timing overrides. Only `duration` (ms) and `easing` are read;
	 * supports responsive values and wins over the `motion` theme slot.
	 */
	transition?: ResponsiveProps<FSOProps>;
	/**
	 * Theme overrides for the stepper parts, including its `motion` slot.
	 */
	theme?: StepperThemeProps;
	/**
	 * Layout variant applied to the stepper, container, and step panels.
	 */
	mode?: 'classic' | 'vertical';
	/**
	 * ARIA role applied to each panel. Pass null for neutral semantic containers.
	 * @default 'tabpanel'
	 */
	panelRole?: 'tabpanel' | 'group' | null;
	/**
	 * aria-labelledby value for each panel. Defaults to `stepper-{index}` when
	 * panelRole is `tabpanel`; pass false to omit it.
	 */
	panelAriaLabelledby?: StepperPanelAriaLabelledby<Item>;
	/** Accessible label applied to each panel. */
	panelAriaLabel?: StepperPanelAriaLabel<Item>;
	/** DOM id for each panel, so a tab can reference it with `aria-controls`. */
	panelId?: (index: number) => string;
	/**
	 * When each panel's content is created.
	 * `eager` creates every panel up front, `lazy` creates a panel the first time it is
	 * activated and destroys it once the slide away from it has finished, `once` keeps it after
	 * the first activation. Inactive panels are `inert` and `aria-hidden` immediately and
	 * `hidden` as soon as the slide settles, so at rest exactly one panel is not `hidden`.
	 * @default 'eager'
	 */
	mount?: StepperMount;
};
