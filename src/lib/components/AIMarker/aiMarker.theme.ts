import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'group/ai-marker relative flex min-h-4 w-full items-center gap-md text-left text-sm text-neutral/70 [&_svg:not([class*=size-])]:size-4',
	variants: {
		variant: {
			default: null,
			separator: null,
			border: 'border-b border-neutral-muted pb-md'
		}
	},
	defaultVariants: { variant: 'default' }
});
const defaultRule = cva({ base: 'h-px min-w-0 flex-1 bg-neutral-muted' });
const defaultIcon = cva({
	base: 'flex size-4 shrink-0 items-center justify-center [&_svg:not([class*=size-])]:size-4'
});
const defaultContent = cva({
	base: 'min-w-0 break-words [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-neutral',
	variants: { centered: { true: 'flex-none text-center', false: null } },
	defaultVariants: { centered: false }
});

export const aiMarkerTheme = {
	root: defaultRoot,
	rule: defaultRule,
	icon: defaultIcon,
	content: defaultContent
};
export type AIMarkerTheme = typeof aiMarkerTheme;
export type AIMarkerThemeProps = InferComponentTheme<AIMarkerTheme>;
export const setAIMarkerTheme = setComponentTheme<AIMarkerTheme>('aiMarker');
export const useAIMarkerTheme = useComponentTheme<AIMarkerTheme>('aiMarker', aiMarkerTheme);
