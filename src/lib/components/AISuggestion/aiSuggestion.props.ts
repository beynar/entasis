import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ButtonProps } from '$lib/components/Button/button.props.js';
import type { ScrollAreaProps } from '$lib/components/ScrollArea/scrollArea.props.js';
import type { ScrollAreaThemeProps } from '$lib/components/ScrollArea/scrollArea.theme.js';
import type { AISuggestionThemeProps } from './aiSuggestion.theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';

type SuggestionNativeAttributes = Omit<
	HTMLButtonAttributes,
	keyof ButtonProps | 'children' | 'class' | 'onclick'
>;

export type SuggestionProps = Omit<
	ButtonProps,
	| 'ref'
	| 'children'
	| 'onclick'
	| 'class'
	| 'theme'
	| 'href'
	| 'target'
	| 'rel'
	| 'download'
	| 'aria-pressed'
	| 'data-active'
> &
	SuggestionNativeAttributes & {
		/** Bindable reference to the rendered suggestion button. */
		ref?: HTMLButtonElement | null;
		/** Suggestion value passed to `onSelect`. */
		suggestion: string;
		/** Marks the suggestion as selected. */
		selected?: boolean;
		/** Replaces the default suggestion label. */
		children?: Slot;
		/** Called with the suggestion value when selected. */
		onSelect?: (suggestion: string) => void;
		/** Class applied to the suggestion button. */
		class?: string;
		/** Theme overrides shared by `Suggestion` and `Suggestions`. */
		theme?: AISuggestionThemeProps;
	};

export type SuggestionRenderPayload = {
	suggestion: string;
	selected: boolean;
	disabled: boolean;
	select: () => void;
};

export type SuggestionsProps = Omit<
	ScrollAreaProps,
	'ref' | 'viewportRef' | 'children' | 'class' | 'theme' | 'scrollFade'
> &
	WithAttachments<{
		/** Bindable reference to the root scroll area. */
		ref?: HTMLDivElement | null;
		/** Bindable reference to the native horizontal scrolling viewport. */
		viewportRef?: HTMLDivElement | null;
		/** Bindable reference to the inner horizontal list. */
		listRef?: HTMLDivElement | null;
		/** Ordered suggestion values. */
		suggestions: readonly string[];
		/** Bindable selected suggestion. */
		value?: string;
		/** Initial selected suggestion when value is omitted. */
		defaultValue?: string;
		/** Called once for each library-originated change to the selected suggestion. */
		onValueChange?: (value: string) => void;
		/** Disables every suggestion. */
		disabled?: boolean;
		/** Button treatment applied to the built-in suggestion items. */
		variant?: SuggestionProps['variant'];
		/** Enables the shared scroll-fade utility on horizontal overflow. */
		scrollFade?: boolean;
		/** Custom suggestion renderer with selection state and action. */
		suggestion?: Slot<SuggestionRenderPayload>;
		/** Called after a suggestion is selected. */
		onSuggestionSelect?: (suggestion: string) => void;
		/** Class applied to the root scroll area. */
		class?: string;
		/** Theme overrides shared by `Suggestion` and `Suggestions`. */
		theme?: AISuggestionThemeProps;
		/** Theme overrides forwarded to the underlying `ScrollArea`. */
		scrollAreaTheme?: ScrollAreaThemeProps;
	}>;
