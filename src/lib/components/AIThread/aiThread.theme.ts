import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({ base: 'relative flex min-h-0 min-w-0 flex-1 flex-col' });
const defaultHeader = cva({ base: 'shrink-0' });
const defaultBody = cva({ base: 'relative flex min-h-0 min-w-0 flex-1' });
const defaultViewport = cva({
	base: 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		tocSide: {
			left: 'pl-layout-lg',
			right: 'pr-layout-lg'
		}
	}
});
const defaultList = cva({ base: 'relative w-full' });
const defaultItem = cva({
	base: 'absolute top-0 left-0 z-0 w-full hover:!z-20 focus-within:!z-20',
	variants: {
		density: {
			compact: 'px-lg py-micro',
			normal: 'px-xl py-md',
			comfortable: 'px-layout-sm py-lg'
		}
	},
	defaultVariants: { density: 'normal' }
});
// The centred reading column. `--ai-thread-content-width` (the `contentWidth` prop) wins over an
// ancestor's `--ai-chat-content-width`; with neither, rows span the thread.
const defaultContent = cva({
	base: 'mx-auto w-full min-w-0 max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))]'
});
const defaultEmpty = cva({
	base: 'mx-auto flex min-h-full w-full max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))] flex-col items-center justify-center gap-xl px-xl py-layout-sm text-center'
});
const defaultGreeting = cva({ base: 'text-xl font-semibold text-balance text-neutral' });
const defaultEmptySuggestions = cva({
	base: 'flex max-w-full min-w-0 flex-wrap justify-center gap-sm'
});
const defaultFollowUps = cva({ base: 'shrink-0 px-xl pb-sm' });
const defaultFollowUpList = cva({
	base: 'mx-auto flex w-full min-w-0 max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))] flex-wrap gap-sm'
});
// The pending assistant row's label: rendered inside an assistant AIMessage, so it takes the
// message's type size and column, with the shared `shimmer` utility on top.
const defaultPending = cva({ base: 'shimmer text-neutral/70' });
const defaultError = cva({ base: 'w-full min-w-0' });
const defaultErrorBody = cva({ base: 'flex flex-col items-start gap-sm' });
const defaultSources = cva({ base: 'flex min-w-0 flex-wrap items-center gap-xs text-sm' });
const defaultSourcesLabel = cva({ base: 'text-xs font-medium text-neutral/70' });
const defaultSource = cva({
	base: 'inline-flex h-6 max-w-60 min-w-0 items-center truncate rounded-full border border-neutral-muted px-md text-xs text-neutral/70 [&[href]]:state-layer [&[href]]:hover:text-neutral'
});
const defaultActions = cva({ base: 'w-full min-w-0' });
const defaultScrollButton = cva({
	base: 'absolute bottom-md z-10 rounded-full bg-surface-raised lift-2',
	variants: {
		position: {
			left: 'left-md',
			center: 'left-1/2 -translate-x-1/2',
			right: 'right-md'
		}
	},
	defaultVariants: { position: 'center' }
});
const defaultAskQuestion = cva({
	base: 'shrink-0 border-t border-neutral-muted p-lg'
});
const defaultTocOverlay = cva({
	base: 'pointer-events-none absolute inset-y-0 z-10 flex items-center py-lg',
	variants: {
		side: {
			left: 'left-0',
			right: 'right-0'
		}
	},
	defaultVariants: { side: 'left' }
});
const defaultFooter = cva({ base: 'shrink-0' });
export const aiThreadTheme = {
	root: defaultRoot,
	header: defaultHeader,
	body: defaultBody,
	viewport: defaultViewport,
	list: defaultList,
	item: defaultItem,
	content: defaultContent,
	empty: defaultEmpty,
	greeting: defaultGreeting,
	emptySuggestions: defaultEmptySuggestions,
	followUps: defaultFollowUps,
	followUpList: defaultFollowUpList,
	pending: defaultPending,
	error: defaultError,
	errorBody: defaultErrorBody,
	sources: defaultSources,
	sourcesLabel: defaultSourcesLabel,
	source: defaultSource,
	actions: defaultActions,
	scrollButton: defaultScrollButton,
	askQuestion: defaultAskQuestion,
	tocOverlay: defaultTocOverlay,
	footer: defaultFooter
};
export type AIThreadTheme = typeof aiThreadTheme;
export type AIThreadThemeProps = InferComponentTheme<AIThreadTheme>;
export const setAIThreadTheme = setComponentTheme<AIThreadTheme>('ai-thread');
export const useAIThreadTheme = useComponentTheme<AIThreadTheme>('ai-thread', aiThreadTheme);
