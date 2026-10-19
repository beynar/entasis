import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// The row is a container: in a narrow one (under 28rem, a phone or a side panel) the chips keep
// their height but trim their side padding and gaps, so more of them fit before the scroll fade.
const defaultRoot = cva({ base: '@container min-w-0 w-full' });
const defaultList = cva({
	base: 'flex w-max min-w-full flex-nowrap items-center gap-md @max-md:gap-sm py-xs'
});
const defaultSuggestion = cva({ base: 'shrink-0 rounded-full px-xl @max-md:px-md' });

export const aiSuggestionTheme = {
	root: defaultRoot,
	list: defaultList,
	suggestion: defaultSuggestion
};
export type AISuggestionTheme = typeof aiSuggestionTheme;
export type AISuggestionThemeProps = InferComponentTheme<AISuggestionTheme>;
export const setAISuggestionTheme = setComponentTheme<AISuggestionTheme>('ai-suggestion');
export const useAISuggestionTheme = useComponentTheme<AISuggestionTheme>(
	'ai-suggestion',
	aiSuggestionTheme
);
