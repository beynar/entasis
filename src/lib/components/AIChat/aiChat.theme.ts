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
// The composer is its own raised card, so its band has no rule above it: the card separates
// itself from the transcript.
const defaultComposer = cva({ base: 'shrink-0 px-lg pt-xs pb-lg' });
const defaultControls = cva({ base: 'flex min-w-0 items-center gap-md' });
const defaultFooter = cva({ base: 'shrink-0 border-t border-neutral-muted px-xl py-md' });
// The skeleton mirrors the default chat: rows in the centred column, user turns as end-aligned
// bubbles, assistant turns as flat lines of prose, and the composer as a bordered card.
const defaultSkeletonMessages = cva({
	base: 'mx-auto grid h-full min-h-0 w-full max-w-[var(--ai-chat-content-width,none)] content-end gap-layout-sm overflow-hidden px-xl py-layout-sm'
});
const defaultSkeletonUser = cva({
	base: 'ms-auto h-control-lg w-2/5 max-w-sm rounded-lg rounded-ee-sm'
});
const defaultSkeletonAssistant = cva({ base: 'flex min-w-0 flex-col gap-sm' });
const defaultSkeletonComposer = cva({
	base: 'mx-auto grid w-full max-w-[var(--ai-chat-content-width,none)] gap-md rounded-lg border border-neutral-muted bg-surface-raised p-sm lift-2'
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
	skeletonMessages: defaultSkeletonMessages,
	skeletonUser: defaultSkeletonUser,
	skeletonAssistant: defaultSkeletonAssistant,
	skeletonComposer: defaultSkeletonComposer
};
export type AIChatTheme = typeof aiChatTheme;
export type AIChatThemeProps = InferComponentTheme<AIChatTheme>;
export const setAIChatTheme = setComponentTheme<AIChatTheme>('ai-chat');
export const useAIChatTheme = useComponentTheme<AIChatTheme>('ai-chat', aiChatTheme);
