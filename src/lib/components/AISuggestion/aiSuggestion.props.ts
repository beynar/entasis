import type { Slot } from '$lib/components/Slot/slot.js';
import type { ButtonProps } from '$lib/components/Button/button.props.js';
import type { AISuggestionThemeProps } from './aiSuggestion.theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';

type AISuggestionNativeAttributes = Omit<
	HTMLButtonAttributes,
	keyof ButtonProps | 'children' | 'class' | 'onclick' | 'role' | `aria-${string}`
>;

export type AISuggestionProps = Omit<
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
	| 'pressed'
	| 'selected'
	| 'data-active'
> &
	AISuggestionNativeAttributes & {
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
		/** Theme overrides shared by `AISuggestion` and `AISuggestions`. */
		theme?: AISuggestionThemeProps;
	};

export type AISuggestionRenderPayload = {
	suggestion: string;
	selected: boolean;
	disabled: boolean;
	select: () => void;
};
