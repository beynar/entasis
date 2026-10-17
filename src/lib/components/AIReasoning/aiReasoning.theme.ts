import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
// No outer margin: the thread or message owns the spacing between reasoning and the answer.
const defaultRoot = cva({ base: 'not-prose min-w-0' });
// Compact like a chat app's "Thought for…" line: py-xs keeps it about 28px tall.
const defaultTrigger = cva({
	base: 'flex w-fit max-w-full min-w-0 items-center justify-start gap-md py-xs text-sm text-neutral/70 transition-colors hover:text-neutral'
});
const defaultIcon = cva({ base: 'size-4 shrink-0' });
// One grid cell for every cycled label, so the trigger width follows the widest one.
const defaultStatus = cva({ base: 'grid min-w-0 [&>*]:[grid-area:1/1]' });
const defaultMessage = cva({
	base: 'min-w-0 truncate',
	variants: {
		current: {
			true: 'shimmer',
			false: 'invisible'
		}
	},
	defaultVariants: { current: true }
});
// The live count and its widest same-unit reading share one grid cell (see `elapsedReserve`).
const defaultElapsed = cva({
	base: 'grid shrink-0 whitespace-nowrap tabular-nums text-neutral/70 [&>*]:[grid-area:1/1]'
});
const defaultElapsedReserve = cva({ base: 'invisible' });
const defaultDuration = cva({ base: 'min-w-0' });
// Reasoning reads quieter than the answer: muted, text-sm, and Markdown's own body colour yields.
// Compact: a small gap under the trigger, tight paragraph spacing, and the small Markdown scale
// (12px, normal leading), so reasoning reads one step quieter than the answer it precedes.
const defaultContent = cva({
	base: 'mt-xs min-w-0 border-s border-neutral-muted ps-xl text-neutral/70 [&_:is(p,li,ul,ol,blockquote,strong,em,h1,h2,h3,h4,h5,h6)]:text-inherit [&_:is(p,ul,ol,blockquote,pre)]:!my-sm'
});
// While streaming: a bounded window that follows the newest lines, fading out at the top.
const defaultStream = cva({
	base: 'flex max-h-40 min-w-0 flex-col justify-end overflow-hidden',
	variants: {
		overflowing: {
			true: '[mask-image:linear-gradient(to_bottom,transparent,black_3rem)]',
			false: ''
		}
	},
	defaultVariants: { overflowing: false }
});
const defaultStreamBody = cva({ base: 'min-w-0 shrink-0' });
export const aiReasoningTheme = {
	root: defaultRoot,
	trigger: defaultTrigger,
	icon: defaultIcon,
	status: defaultStatus,
	message: defaultMessage,
	elapsed: defaultElapsed,
	elapsedReserve: defaultElapsedReserve,
	duration: defaultDuration,
	content: defaultContent,
	stream: defaultStream,
	streamBody: defaultStreamBody
};
export type AIReasoningTheme = typeof aiReasoningTheme;
export type AIReasoningThemeProps = InferComponentTheme<AIReasoningTheme>;
export const setAIReasoningTheme = setComponentTheme<AIReasoningTheme>('ai-reasoning');
export const useAIReasoningTheme = useComponentTheme<AIReasoningTheme>(
	'ai-reasoning',
	aiReasoningTheme
);
