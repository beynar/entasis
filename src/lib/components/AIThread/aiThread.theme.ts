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
	// `isolate`: rows raise themselves on hover (to keep their action bar on top), and that must not
	// lift them above what floats over the transcript (the follow-up suggestions, the scroll button).
	base: [
		'isolate min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
		// The native scrollbar, drawn like ScrollArea's: a thin rounded `neutral-muted` thumb with no
		// track, shown while the pointer is over the transcript. The virtualized list stays on the
		// native scroller (a ScrollArea's content observer fights its row measurement). WebKit/Blink
		// read the `::-webkit-scrollbar` parts; Firefox, which has none, gets the standard properties
		// (set only there: in Chromium they would switch the parts off).
		'[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent',
		'[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-neutral-muted',
		'supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-width:thin] supports-[not_selector(::-webkit-scrollbar)]:[scrollbar-color:transparent_transparent] supports-[not_selector(::-webkit-scrollbar)]:hover:[scrollbar-color:var(--color-neutral-muted)_transparent]'
	].join(' '),
	variants: {
		tocSide: {
			left: 'pl-layout-lg',
			right: 'pr-layout-lg'
		}
	}
});
const defaultList = cva({ base: 'relative w-full' });
// One vertical rhythm: rows of a turn (reasoning, tools, text, sources) are one fixed gap apart, the
// first row of the next turn (or marker) adds a larger fixed gap, and a turn's own action-bar row
// sits right under the row it closes. A turn that ends with an action bar is already set apart by
// the bar's reserved height, so the next turn adds only the in-turn gap after it (`afterBar`).
// Rows carry no outer margins of their own.
const defaultItem = cva({
	base: 'absolute top-0 left-0 z-0 w-full hover:!z-20 focus-within:!z-20',
	variants: {
		density: {
			compact: 'px-lg pb-micro',
			normal: 'px-xl pb-md',
			comfortable: 'px-layout-sm pb-lg'
		},
		boundary: {
			part: null,
			unit: null,
			afterBar: null,
			bar: 'pt-0'
		}
	},
	compoundVariants: [
		{ boundary: 'part', density: 'compact', class: 'pt-micro' },
		{ boundary: 'part', density: 'normal', class: 'pt-md' },
		{ boundary: 'part', density: 'comfortable', class: 'pt-lg' },
		{ boundary: 'afterBar', density: 'compact', class: 'pt-micro' },
		{ boundary: 'afterBar', density: 'normal', class: 'pt-md' },
		{ boundary: 'afterBar', density: 'comfortable', class: 'pt-lg' },
		{ boundary: 'unit', density: 'compact', class: 'pt-md' },
		{ boundary: 'unit', density: 'normal', class: 'pt-layout-md' },
		{ boundary: 'unit', density: 'comfortable', class: 'pt-layout-lg' }
	],
	defaultVariants: { density: 'normal', boundary: 'part' }
});
// AIMessage rendered by the thread: the row supplies the vertical rhythm, so the message adds none.
const defaultMessage = cva({ base: 'py-0' });
// The centred reading column. `--ai-thread-content-width` (the `contentWidth` prop) wins over an
// ancestor's `--ai-chat-content-width`; with neither, rows span the thread.
const defaultContent = cva({
	base: 'mx-auto w-full min-w-0 max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))]'
});
const defaultEmpty = cva({
	base: 'mx-auto flex min-h-full w-full max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))] flex-col items-center justify-center gap-xl px-xl py-layout-sm text-center'
});
const defaultGreeting = cva({ base: 'text-lg font-semibold text-balance text-neutral' });
const defaultEmptySuggestions = cva({
	base: 'flex max-w-full min-w-0 flex-wrap justify-center gap-sm'
});
// Follow-ups share the rows' inline inset at the thread's density.
// Floats over the bottom of the transcript, with no band of its own: the text scrolls behind the
// chips, and the list's end padding (the row's height) keeps the last row clear of them at the end.
// Only the chips' column takes the pointer; the transcript beside it stays selectable.
const defaultFollowUps = cva({
	base: 'pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-sm',
	variants: {
		density: {
			compact: 'px-lg',
			normal: 'px-xl',
			comfortable: 'px-layout-sm'
		}
	},
	defaultVariants: { density: 'normal' }
});
// The content column holding the follow-up row. The row pads itself vertically for focus rings,
// so the negative block margin keeps the band as tall as before.
const defaultFollowUpList = cva({
	base: 'pointer-events-auto mx-auto -my-xs w-full min-w-0 max-w-[var(--ai-thread-content-width,var(--ai-chat-content-width,none))]'
});
// The pending assistant row's label: rendered inside an assistant AIMessage, so it takes the
// message's type size and column, with the shared `shimmer` utility on top.
const defaultPending = cva({ base: 'shimmer text-neutral/70' });
const defaultError = cva({ base: 'w-full min-w-0' });
const defaultErrorBody = cva({ base: 'flex flex-col items-start gap-sm' });
const defaultSources = cva({
	base: 'group/ai-thread-sources-size flex min-w-0 flex-wrap items-center gap-xs text-sm data-[size=small]:text-xs data-[size=large]:text-base'
});
const defaultSourcesLabel = cva({
	base: 'text-xs group-data-[size=large]/ai-thread-sources-size:text-sm font-medium text-neutral/70'
});
const defaultSource = cva({
	base: 'inline-flex h-6 max-w-60 min-w-0 items-center truncate rounded-full border border-neutral-muted px-md text-xs group-data-[size=large]/ai-thread-sources-size:text-sm text-neutral/70 [&[href]]:state-layer [&[href]]:hover:text-neutral'
});
// A turn's action-bar row. AIMessageActions sizes the row to its buttons.
const defaultActions = cva({ base: '' });
const defaultScrollButton = cva({
	// Above the follow-up suggestions when they show (`--ai-thread-follow-ups-height`).
	base: 'absolute bottom-[calc(var(--space-md)+var(--ai-thread-follow-ups-height,0px))] z-10 rounded-full bg-surface-raised lift-2',
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
	message: defaultMessage,
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
