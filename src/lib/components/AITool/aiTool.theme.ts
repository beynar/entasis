import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'inline-grid max-w-full min-w-0 align-top text-neutral transition-[color,background-color,box-shadow]',
	variants: {
		scope: {
			single: '',
			group: ''
		},
		variant: {
			card: '',
			ghost: '',
			outline: '',
			soft: ''
		},
		tone: {
			active: '',
			success: '',
			error: '',
			cancelled: '',
			default: ''
		}
	},
	compoundVariants: [
		{
			scope: 'single',
			variant: 'card',
			class: 'rounded-lg bg-surface-raised ring-1 ring-neutral-muted lift-1'
		},
		{ scope: 'single', variant: 'outline', class: 'rounded-lg ring-1 ring-neutral-muted' },
		{ scope: 'single', variant: 'soft', tone: 'active', class: 'rounded-lg bg-info/5' },
		{ scope: 'single', variant: 'soft', tone: 'success', class: 'rounded-lg bg-success/5' },
		{ scope: 'single', variant: 'soft', tone: 'error', class: 'rounded-lg bg-danger/5' },
		{ scope: 'single', variant: 'soft', tone: 'cancelled', class: 'rounded-lg bg-neutral/5' },
		{ scope: 'single', variant: 'soft', tone: 'default', class: 'rounded-lg bg-neutral/5' }
	],
	defaultVariants: { scope: 'single', variant: 'ghost', tone: 'default' }
});
const defaultAccordionRoot = cva({
	base: 'max-w-full gap-xs',
	variants: {
		scope: {
			single: 'w-[min(32rem,100%)]',
			group: 'w-fit',
			calls: 'w-[min(32rem,calc(100vw-2rem))]'
		}
	}
});
const defaultAccordionItem = cva({
	base: 'max-w-full',
	variants: {
		scope: {
			single: 'w-full',
			group: 'w-fit',
			calls: 'w-full'
		},
		variant: {
			card: '',
			ghost: '',
			outline: '',
			soft: ''
		}
	},
	compoundVariants: [
		{
			scope: 'calls',
			variant: 'card',
			class:
				'mb-md rounded-sm border-b-0 bg-surface-raised ring-1 ring-neutral-muted lift-1 last:mb-0'
		},
		{
			scope: 'calls',
			variant: 'outline',
			class: 'mb-md rounded-sm border-b-0 ring-1 ring-neutral-muted last:mb-0'
		},
		{
			scope: 'calls',
			variant: 'soft',
			class:
				'mb-md rounded-sm border-b-0 bg-neutral/5 last:mb-0 has-[[data-tone=active]]:bg-info/5 has-[[data-tone=success]]:bg-success/5 has-[[data-tone=error]]:bg-danger/5'
		}
	],
	defaultVariants: { variant: 'ghost' }
});
const defaultAccordionHeader = cva({ base: 'min-w-0 flex-1' });
const defaultAccordionTrigger = cva({
	base: 'state-layer relative min-h-row-sm max-w-full items-center gap-md rounded-sm text-left text-xs text-neutral/70 hover:text-neutral',
	variants: {
		scope: {
			single: 'px-md py-sm',
			group: 'w-fit',
			calls: ''
		},
		variant: {
			card: 'px-lg py-md',
			ghost: 'px-md py-sm',
			outline: 'px-lg py-md',
			soft: 'px-lg py-md'
		},
		tone: {
			active: '',
			success: '',
			error: '',
			cancelled: '',
			default: ''
		},
		toggleIcon: {
			none: '',
			chevron: 'pr-layout-md',
			'plus-minus': 'pr-layout-md'
		}
	},
	compoundVariants: [
		{ scope: 'group', variant: 'ghost', class: 'pl-md' },
		{
			scope: 'group',
			variant: 'card',
			class: 'bg-surface-raised ring-1 ring-neutral-muted lift-1'
		},
		{ scope: 'group', variant: 'outline', class: 'ring-1 ring-neutral-muted' },
		{ scope: 'group', variant: 'soft', tone: 'active', class: 'bg-info/5' },
		{ scope: 'group', variant: 'soft', tone: 'success', class: 'bg-success/5' },
		{ scope: 'group', variant: 'soft', tone: 'error', class: 'bg-danger/5' },
		{ scope: 'group', variant: 'soft', tone: 'cancelled', class: 'bg-neutral/5' },
		{ scope: 'group', variant: 'soft', tone: 'default', class: 'bg-neutral/5' }
	],
	defaultVariants: { variant: 'ghost', tone: 'default', toggleIcon: 'none' }
});
const defaultAccordionTitle = cva({
	base: 'min-w-0 w-full no-underline group-hover/accordion-trigger:no-underline'
});
const defaultAccordionIcon = cva({ base: 'size-2.5 text-neutral/45' });
const defaultAccordionIconWrapper = cva({
	base: 'pointer-events-none absolute top-1/2 right-2 flex size-2.5 -translate-y-1/2 items-center justify-center'
});
const defaultAccordionContent = cva({
	base: 'min-w-0 pt-0',
	variants: {
		scope: {
			single: 'px-md pb-md',
			group: 'px-0 pb-xs',
			calls: 'px-0 pb-md'
		},
		variant: {
			card: '',
			ghost: '',
			outline: '',
			soft: ''
		}
	},
	compoundVariants: [
		{ scope: 'calls', variant: 'card', class: 'px-lg pt-md pb-lg' },
		{ scope: 'calls', variant: 'outline', class: 'px-lg pt-md pb-lg' },
		{ scope: 'calls', variant: 'soft', class: 'px-lg pt-md pb-lg' }
	],
	defaultVariants: { variant: 'ghost' }
});
const defaultTitle = cva({ base: 'flex min-w-0 flex-1 items-center gap-md text-xs' });
// Status is a bare mark, no badge: a spinner while the call runs, a dot once it has settled,
// coloured by outcome. The box is the icon size so rows and the group title line up.
const defaultIndicator = cva({
	base: 'flex size-icon-md shrink-0 items-center justify-center',
	variants: {
		tone: {
			active: 'text-info',
			success: 'text-success',
			error: 'text-danger',
			cancelled: 'text-neutral/45',
			default: 'text-neutral/45'
		}
	}
});
const defaultIndicatorDot = cva({ base: 'size-1.5 rounded-full bg-current' });
const defaultGroupIcon = cva({
	base: 'flex size-icon-md shrink-0 items-center justify-center',
	variants: {
		tone: {
			active: 'text-info',
			success: 'text-success',
			error: 'text-danger',
			cancelled: 'text-neutral/45',
			default: 'text-neutral/45'
		}
	},
	defaultVariants: { tone: 'default' }
});
const defaultName = cva({ base: 'min-w-0 flex-1 truncate font-medium text-neutral' });
const defaultStatus = cva({ base: 'shrink-0' });
const defaultContent = cva({ base: 'grid min-w-0 gap-md pb-xs' });
const defaultGroupContent = cva({
	base: 'min-w-0 pl-xs',
	variants: {
		variant: {
			card: 'pt-md',
			ghost: '',
			outline: 'pt-md',
			soft: 'pt-md'
		}
	},
	defaultVariants: { variant: 'ghost' }
});
const defaultSection = cva({
	base: 'relative grid min-w-0 gap-sm rounded-sm border bg-surface p-md',
	variants: {
		tone: {
			default: 'border-neutral-muted',
			error: 'border-danger/20 bg-danger/5'
		}
	}
});
const defaultLabel = cva({
	base: 'flex h-3.5 w-fit items-center',
	variants: {
		kind: {
			icon: 'absolute top-2 right-2 z-10',
			text: 'text-xs font-medium tracking-wide uppercase'
		},
		tone: {
			default: 'text-neutral/70',
			error: 'text-danger-readable'
		}
	},
	defaultVariants: { kind: 'text' }
});
// A full-width block flush inside `section`'s padding box, so its own `sm` step is capped by what
// that padding leaves: `rounded-sm p-md` → `min(4px, 4 - 8)` → 0, a square corner, rather than a
// repeat of the section's own radius.
const defaultScrollArea = cva({
	base: 'flex max-h-48 min-w-0 flex-col rounded-sm-concentric',
	variants: {
		tone: {
			default: 'bg-surface-raised/60',
			error: 'bg-danger/5'
		}
	}
});
const defaultScrollViewport = cva({ base: 'max-h-48 w-full' });
const defaultScrollContent = cva({ base: 'min-w-full' });
const defaultScrollScrollbar = cva({ base: '' });
const defaultScrollScrollbarX = cva({ base: '' });
const defaultScrollThumb = cva({
	base: '',
	variants: {
		tone: {
			default: 'bg-neutral-muted',
			error: 'bg-danger/45'
		}
	}
});
const defaultEmpty = cva({ base: 'py-xs text-xs text-neutral/70' });
const defaultTree = cva({ base: 'grid min-w-full gap-xs p-md text-xs' });
const defaultTreeNode = cva({ base: 'min-w-0' });
const defaultTreeBranch = cva({ base: 'flex min-w-0 items-baseline gap-md' });
const defaultTreeKey = cva({ base: 'min-w-0 truncate text-neutral/70' });
const defaultTreeSummary = cva({ base: 'shrink-0 text-xs text-neutral/70' });
const defaultTreeChildren = cva({
	base: 'mt-xs ml-xs grid gap-xs border-l border-neutral-muted pl-lg'
});
const defaultTreeLeaf = cva({
	base: 'grid w-max min-w-full grid-cols-[minmax(4rem,8rem)_max-content] items-baseline gap-lg'
});
const defaultTreeValue = cva({
	base: 'whitespace-pre font-mono text-xs leading-relaxed',
	variants: {
		kind: {
			string: 'text-neutral',
			number: 'text-neutral tabular-nums',
			boolean: 'text-primary-readable',
			null: 'text-neutral/70 italic',
			undefined: 'text-neutral/70 italic',
			empty: 'text-neutral/70 italic',
			unknown: 'text-neutral'
		},
		tone: {
			default: '',
			error: 'text-danger-readable'
		}
	}
});

export const aiToolTheme = {
	root: defaultRoot,
	accordionRoot: defaultAccordionRoot,
	accordionItem: defaultAccordionItem,
	accordionHeader: defaultAccordionHeader,
	accordionTrigger: defaultAccordionTrigger,
	accordionTitle: defaultAccordionTitle,
	accordionIcon: defaultAccordionIcon,
	accordionIconWrapper: defaultAccordionIconWrapper,
	accordionContent: defaultAccordionContent,
	title: defaultTitle,
	indicator: defaultIndicator,
	indicatorDot: defaultIndicatorDot,
	groupIcon: defaultGroupIcon,
	name: defaultName,
	status: defaultStatus,
	content: defaultContent,
	groupContent: defaultGroupContent,
	section: defaultSection,
	label: defaultLabel,
	scrollArea: defaultScrollArea,
	scrollViewport: defaultScrollViewport,
	scrollContent: defaultScrollContent,
	scrollScrollbar: defaultScrollScrollbar,
	scrollScrollbarX: defaultScrollScrollbarX,
	scrollThumb: defaultScrollThumb,
	empty: defaultEmpty,
	tree: defaultTree,
	treeNode: defaultTreeNode,
	treeBranch: defaultTreeBranch,
	treeKey: defaultTreeKey,
	treeSummary: defaultTreeSummary,
	treeChildren: defaultTreeChildren,
	treeLeaf: defaultTreeLeaf,
	treeValue: defaultTreeValue
};
export type AIToolTheme = typeof aiToolTheme;
export type AIToolThemeProps = InferComponentTheme<AIToolTheme>;
export const setAIToolTheme = setComponentTheme<AIToolTheme>('aiTool');
export const useAIToolTheme = useComponentTheme<AIToolTheme>('aiTool', aiToolTheme);
