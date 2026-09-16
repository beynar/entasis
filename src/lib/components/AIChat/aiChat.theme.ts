import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-muted bg-surface'
});
const defaultHeader = cva({ base: 'shrink-0 border-b border-neutral-muted px-xl py-lg' });
const defaultError = cva({ base: 'shrink-0 px-xl pt-lg' });
const defaultBeforeThread = cva({ base: 'shrink-0' });
const defaultThread = cva({ base: 'min-h-0 flex-1' });
const defaultAfterThread = cva({ base: 'shrink-0' });
const defaultSuggestions = cva({ base: 'border-t border-neutral-muted px-lg py-md' });
const defaultComposer = cva({ base: 'shrink-0 border-t border-neutral-muted p-lg' });
const defaultControls = cva({ base: 'flex min-w-0 items-center gap-md' });
const defaultFooter = cva({ base: 'shrink-0 border-t border-neutral-muted px-xl py-md' });
const defaultSkeletonMessages = cva({
	base: 'grid h-full min-h-0 content-end gap-layout-sm overflow-hidden p-layout-sm'
});

export const aiChatTheme = {
	root: defaultRoot,
	header: defaultHeader,
	error: defaultError,
	beforeThread: defaultBeforeThread,
	thread: defaultThread,
	afterThread: defaultAfterThread,
	suggestions: defaultSuggestions,
	composer: defaultComposer,
	controls: defaultControls,
	footer: defaultFooter,
	skeletonMessages: defaultSkeletonMessages
};
export type AIChatTheme = typeof aiChatTheme;
export type AIChatThemeProps = InferComponentTheme<AIChatTheme>;
export const setAIChatTheme = setComponentTheme<AIChatTheme>('aiChat');
export const useAIChatTheme = useComponentTheme<AIChatTheme>('aiChat', aiChatTheme);
