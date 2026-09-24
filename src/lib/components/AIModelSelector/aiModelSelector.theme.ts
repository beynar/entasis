import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({ base: 'inline-flex min-w-0' });
const defaultTrigger = cva({ base: 'min-w-44 justify-between gap-md' });
const defaultTriggerContent = cva({ base: 'flex min-w-0 items-center gap-md' });
const defaultTriggerIcon = cva({
	base: 'flex size-5 shrink-0 items-center justify-center rounded-sm border border-neutral-muted bg-surface text-xs'
});
const defaultTriggerLabel = cva({
	base: 'min-w-0 truncate',
	variants: { selected: { true: 'text-neutral', false: 'text-neutral/70' } },
	defaultVariants: { selected: false }
});
const defaultSearch = cva({ base: 'p-xs' });
const defaultPopover = cva({ base: 'min-w-56' });
const defaultMenu = cva({ base: 'min-w-56' });
const defaultProvider = cva({ base: 'justify-start text-xs font-semibold text-neutral/70' });
const defaultOption = cva({
	base: '',
	variants: { selected: { true: '', false: '' } },
	defaultVariants: { selected: false }
});
const defaultGroup = cva({ base: '' });
const defaultEmpty = cva({ base: 'justify-start text-neutral/70' });
export const aiModelSelectorTheme = {
	root: defaultRoot,
	trigger: defaultTrigger,
	triggerContent: defaultTriggerContent,
	triggerIcon: defaultTriggerIcon,
	triggerLabel: defaultTriggerLabel,
	search: defaultSearch,
	popover: defaultPopover,
	menu: defaultMenu,
	provider: defaultProvider,
	option: defaultOption,
	group: defaultGroup,
	empty: defaultEmpty
};
export type AIModelSelectorTheme = typeof aiModelSelectorTheme;
export type AIModelSelectorThemeProps = InferComponentTheme<AIModelSelectorTheme>;
export const setAIModelSelectorTheme = setComponentTheme<AIModelSelectorTheme>('ai-model-selector');
export const useAIModelSelectorTheme = useComponentTheme<AIModelSelectorTheme>(
	'aiModelSelector',
	aiModelSelectorTheme
);
