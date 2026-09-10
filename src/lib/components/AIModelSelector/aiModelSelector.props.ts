import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { MenuItem } from '../Menu/menu.props.js';
import type { AIModelSelectorThemeProps } from './aiModelSelector.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

export type AIModelSelectorModel = {
	id: string;
	label: string;
	provider?: string;
	description?: string;
	icon?: Slot;
	contextWindow?: number;
	disabled?: boolean;
	keywords?: string[];
};
export type AIModelSelectorGroup = {
	label: string;
	icon?: Slot;
	models?: readonly AIModelSelectorModel[];
	groups?: readonly AIModelSelectorGroup[];
	disabled?: boolean;
};
export type AIModelSelectorMenuItem = MenuItem;

export type AIModelSelectorLabels = {
	/** Trigger text shown with no selected model. */
	placeholder: string;
	/** Accessible trigger name when no model or visible placeholder is present. */
	triggerAriaLabel: string;
	/** Search field placeholder and accessible label. */
	searchPlaceholder: string;
	/** Empty-search message. */
	empty: string;
	/** Heading used when a flat model does not declare a provider. */
	providerFallback: string;
};

export type AIModelSelectorState = {
	model: AIModelSelectorModel | undefined;
	value: string | undefined;
	open: boolean;
	query: string;
	searchable: boolean;
	disabled: boolean;
	labels: AIModelSelectorLabels;
	select: (model: AIModelSelectorModel) => void;
	setQuery: (query: string) => void;
	setOpen: (open: boolean) => void;
	toggle: () => void;
};

export type AIModelSelectorValueChangePayload = {
	value: string;
	model: AIModelSelectorModel;
};

export type AIModelSelectorProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** Bindable reference to the root selector. */
		ref?: HTMLDivElement | null;
		/** Flat model options. */
		models?: readonly AIModelSelectorModel[];
		/** Nested provider or model groups. */
		groups?: readonly AIModelSelectorGroup[];
		/** Selected model id; falls back to conversation state when omitted or undefined. Use `null` for a bindable controlled empty value. */
		value?: string | null;
		/** Initial selected model id when `value` is omitted. */
		defaultValue?: string | null;
		/** Bindable popup state. */
		open?: boolean;
		/** Initial popup state when `open` is omitted. */
		defaultOpen?: boolean;
		/** Called once after a component-owned popup state change. */
		onOpenChange?: (open: boolean) => void;
		/** Bindable search query. */
		query?: string;
		/** Shows the model search header and applies `query` filtering. */
		searchable?: boolean;
		/** Standard Menu items appended after the model choices. Supports recursive submenus for settings such as reasoning effort or speed. */
		menuItems?: readonly AIModelSelectorMenuItem[];
		/** Disables the trigger and every model option. */
		disabled?: boolean;
		/** Trigger text shown with no selection. Falls back to labels and conversation state when omitted or undefined; use `null` to render no placeholder. */
		placeholder?: string | null;
		/** Search input placeholder. */
		searchPlaceholder?: string;
		/** Text shown when search has no matching models. */
		emptyLabel?: string;
		/** Overrides the default trigger, accessible name, search, empty, and provider-fallback copy. */
		labels?: Partial<AIModelSelectorLabels>;
		/** Replaces the complete trigger and receives selector state. Interactive children open the menu on click. */
		children?: Slot<AIModelSelectorState>;
		/** Custom search header receiving complete selector state. */
		search?: Slot<AIModelSelectorState>;
		/** Custom empty search content receiving complete selector state. */
		empty?: Slot<AIModelSelectorState>;
		/** Called once after a valid model changes the selected value. */
		onValueChange?: (payload: AIModelSelectorValueChangePayload) => void;
		/** Class applied to the root selector. */
		class?: string;
		/** Theme overrides for the trigger, search, and menu. */
		theme?: AIModelSelectorThemeProps;
	}
>;
