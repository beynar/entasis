import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({ base: 'not-prose mb-xl min-w-0' });
const defaultTrigger = cva({
	base: 'flex w-fit max-w-full min-w-0 items-center justify-start gap-md text-sm text-neutral/65 transition-colors hover:text-neutral'
});
const defaultIcon = cva({ base: 'size-4 shrink-0' });
const defaultStatus = cva({ base: 'min-w-0' });
const defaultDuration = cva({ base: 'min-w-0' });
const defaultContent = cva({
	base: 'mt-xl min-w-0 border-l border-neutral-muted pl-xl text-sm text-neutral/75'
});
export const aiReasoningTheme = {
	root: defaultRoot,
	trigger: defaultTrigger,
	icon: defaultIcon,
	status: defaultStatus,
	duration: defaultDuration,
	content: defaultContent
};
export type AIReasoningTheme = typeof aiReasoningTheme;
export type AIReasoningThemeProps = InferComponentTheme<AIReasoningTheme>;
export const setAIReasoningTheme = setComponentTheme<AIReasoningTheme>('aiReasoning');
export const useAIReasoningTheme = useComponentTheme<AIReasoningTheme>(
	'aiReasoning',
	aiReasoningTheme
);
