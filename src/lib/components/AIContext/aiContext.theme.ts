import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({ base: 'inline-flex' });
const defaultPopover = cva({ base: 'w-auto p-0' });
const defaultCard = cva({ base: 'w-auto gap-0 py-0' });
const defaultCardContent = cva({ base: 'p-0' });
const defaultTrigger = cva({
	base: 'state-layer inline-flex items-center rounded-sm bg-surface text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40',
	variants: {
		compact: { true: 'size-8 justify-center p-0', false: 'gap-sm px-md py-xs' },
		tone: {
			default: 'text-neutral',
			warning: 'text-warning-readable',
			danger: 'text-danger-readable'
		}
	},
	defaultVariants: { compact: false, tone: 'default' }
});
const defaultProgress = cva({ base: 'shrink-0' });
const defaultTriggerValue = cva({ base: 'text-center font-normal tabular-nums' });
const defaultContent = cva({ base: 'flex min-w-56 flex-col gap-lg p-lg' });
const defaultSummary = cva({ base: 'flex items-start justify-between gap-lg' });
const defaultTitle = cva({ base: 'text-xs leading-4 font-medium' });
const defaultRemaining = cva({ base: 'text-[0.6875rem] leading-4 text-neutral/60' });
const defaultPercent = cva({ base: 'text-xs leading-4 font-medium tabular-nums' });
const defaultMeter = cva({ base: 'h-1.5 overflow-hidden rounded-full bg-neutral-muted' });
const defaultBar = cva({
	base: 'h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none',
	variants: {
		tone: { default: 'bg-primary', warning: 'bg-warning', danger: 'bg-danger' }
	},
	defaultVariants: { tone: 'default' }
});
const defaultRows = cva({ base: 'grid gap-sm text-xs leading-4' });
const defaultRow = cva({ base: 'flex justify-between gap-lg' });
const defaultRowLabel = cva({ base: 'text-neutral/60' });
const defaultRowValue = cva({ base: 'font-medium tabular-nums' });

export const aiContextTheme = {
	root: defaultRoot,
	popover: defaultPopover,
	card: defaultCard,
	cardContent: defaultCardContent,
	trigger: defaultTrigger,
	progress: defaultProgress,
	triggerValue: defaultTriggerValue,
	content: defaultContent,
	summary: defaultSummary,
	title: defaultTitle,
	remaining: defaultRemaining,
	percent: defaultPercent,
	meter: defaultMeter,
	bar: defaultBar,
	rows: defaultRows,
	row: defaultRow,
	rowLabel: defaultRowLabel,
	rowValue: defaultRowValue
};
export type AIContextTheme = typeof aiContextTheme;
export type AIContextThemeProps = InferComponentTheme<AIContextTheme>;
export const setAIContextTheme = setComponentTheme<AIContextTheme>('aiContext');
export const useAIContextTheme = useComponentTheme<AIContextTheme>('aiContext', aiContextTheme);
