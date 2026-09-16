import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ScrollAreaProps } from '$lib/components/ScrollArea/scrollArea.props.js';
import type { ScrollAreaThemeProps } from '$lib/components/ScrollArea/scrollArea.theme.js';
import type { AISuggestionProps, AISuggestionRenderPayload } from './aiSuggestion.props.js';
import type { AISuggestionThemeProps } from './aiSuggestion.theme.js';

export type AISuggestionsProps = Omit<
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
		variant?: AISuggestionProps['variant'];
		/** Enables the shared scroll-fade utility on horizontal overflow. */
		scrollFade?: boolean;
		/** Custom suggestion renderer with selection state and action. */
		suggestion?: Slot<AISuggestionRenderPayload>;
		/** Called after a suggestion is selected. */
		onSelect?: (suggestion: string) => void;
		/** Class applied to the root scroll area. */
		class?: string;
		/** Theme overrides shared by `AISuggestion` and `AISuggestions`. */
		theme?: AISuggestionThemeProps;
		/** Theme overrides forwarded to the underlying `ScrollArea`. */
		scrollAreaTheme?: ScrollAreaThemeProps;
	}>;
