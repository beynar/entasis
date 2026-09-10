import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({ base: 'min-w-0 w-full' });
const defaultList = cva({ base: 'flex w-max min-w-full flex-nowrap items-center gap-md py-xs' });
const defaultSuggestion = cva({ base: 'shrink-0 rounded-full px-xl' });

export const aiSuggestionTheme = {
	root: defaultRoot,
	list: defaultList,
	suggestion: defaultSuggestion
};
export type AISuggestionTheme = typeof aiSuggestionTheme;
export type AISuggestionThemeProps = InferComponentTheme<AISuggestionTheme>;
export const setAISuggestionTheme = setComponentTheme<AISuggestionTheme>('aiSuggestion');
export const useAISuggestionTheme = useComponentTheme<AISuggestionTheme>(
	'aiSuggestion',
	aiSuggestionTheme
);
