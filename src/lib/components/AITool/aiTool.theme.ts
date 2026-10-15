import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const tones = {
	active: '',
	awaiting: '',
	success: '',
	error: '',
	denied: '',
	cancelled: '',
	default: ''
};

// One call and a group share one surface per variant, so a lone call and a group of calls read
// as the same block. The block follows its container, never the viewport, and caps at 32rem.
const defaultRoot = cva({
	base: 'grid w-full max-w-[32rem] min-w-0 text-sm text-neutral transition-[color,background-color,box-shadow]',
	variants: {
		scope: {
			single: '',
			group: ''
		},
		variant: {
			card: 'rounded-lg bg-surface-raised ring-1 ring-neutral-muted lift-1',
			ghost: '',
			outline: 'rounded-lg ring-1 ring-neutral-muted',
			soft: 'rounded-lg'
		},
		tone: tones
	},
	// The soft tint doubles on the dark surface, where `/5` disappears.
	compoundVariants: [
		{ variant: 'soft', tone: 'active', class: 'bg-info/5 dark:bg-info/10' },
		{ variant: 'soft', tone: 'awaiting', class: 'bg-warning/5 dark:bg-warning/10' },
		{ variant: 'soft', tone: 'success', class: 'bg-success/5 dark:bg-success/10' },
		{ variant: 'soft', tone: 'error', class: 'bg-danger/5 dark:bg-danger/10' },
		{ variant: 'soft', tone: 'denied', class: 'bg-neutral/5 dark:bg-neutral/10' },
		{ variant: 'soft', tone: 'cancelled', class: 'bg-neutral/5 dark:bg-neutral/10' },
		{ variant: 'soft', tone: 'default', class: 'bg-neutral/5 dark:bg-neutral/10' }
	],
	defaultVariants: { scope: 'single', variant: 'ghost', tone: 'default' }
});
const defaultAccordionRoot = cva({
	base: 'w-full min-w-0 gap-0',
	variants: {
		scope: {
			single: '',
			group: '',
			calls: ''
		}
	}
});
const defaultAccordionItem = cva({
	base: 'w-full min-w-0 border-b-0',
	variants: {
		scope: {
			single: '',
			group: '',
			calls: ''
		},
		variant: {
			card: '',
			ghost: '',
			outline: '',
			soft: ''
		}
	},
	compoundVariants: [
		// Calls inside a framed group are divided rows of the one surface.
		{ scope: 'calls', variant: 'card', class: 'border-t border-neutral-muted first:border-t-0' },
		{ scope: 'calls', variant: 'outline', class: 'border-t border-neutral-muted first:border-t-0' },
		{ scope: 'calls', variant: 'soft', class: 'border-t border-neutral/10 first:border-t-0' }
	],
	defaultVariants: { variant: 'ghost' }
});
const defaultAccordionHeader = cva({ base: 'min-w-0 flex-1' });
// Group and call rows share padding, so the group header lines up with the calls below it.
const defaultAccordionTrigger = cva({
	base: 'state-layer relative min-h-row-sm w-full min-w-0 items-center gap-md rounded-sm text-left text-sm text-neutral/70 hover:text-neutral',
	variants: {
		scope: {
			single: '',
			group: '',
			calls: ''
		},
		variant: {
			card: 'px-md py-sm',
			ghost: 'px-sm py-xs',
			outline: 'px-md py-sm',
			soft: 'px-md py-sm'
		},
		tone: tones,
		toggleIcon: {
			none: '',
			chevron: 'pr-layout-md',
			'plus-minus': 'pr-layout-md'
		}
	},
	defaultVariants: { variant: 'ghost', tone: 'default', toggleIcon: 'none' }
});
const defaultAccordionTitle = cva({
	base: 'w-full min-w-0 no-underline group-hover/accordion-trigger:no-underline'
});
const defaultAccordionIcon = cva({ base: 'size-2.5 text-neutral/45' });
const defaultAccordionIconWrapper = cva({
	base: 'pointer-events-none absolute top-1/2 right-2 flex size-2.5 -translate-y-1/2 items-center justify-center'
});
const defaultAccordionContent = cva({
	base: 'min-w-0 pt-0',
	variants: {
		scope: {
			single: '',
			group: 'px-0 pb-0',
			calls: ''
		},
		variant: {
			card: '',
			ghost: '',
			outline: '',
			soft: ''
		}
	},
	compoundVariants: [
		{ scope: 'single', variant: 'ghost', class: 'px-sm pb-sm' },
		{ scope: 'calls', variant: 'ghost', class: 'px-sm pb-sm' },
		{ scope: 'single', variant: ['card', 'outline', 'soft'], class: 'px-md pb-md' },
		{ scope: 'calls', variant: ['card', 'outline', 'soft'], class: 'px-md pb-md' }
	],
	defaultVariants: { variant: 'ghost' }
});
const defaultTitle = cva({ base: 'flex min-w-0 flex-1 items-center gap-md text-sm' });
// The leading mark: a spinner while the call runs, then a glyph for the outcome, so status reads
// by shape as well as colour. The box is the icon size so rows and the group title line up.
const defaultIndicator = cva({
	base: 'flex size-icon-md shrink-0 items-center justify-center',
	variants: {
		tone: {
			active: 'text-info',
			awaiting: 'text-warning-readable',
			success: 'text-success-readable',
			error: 'text-danger-readable',
			denied: 'text-neutral/60',
			cancelled: 'text-neutral/60',
			default: 'text-neutral/45'
		}
	},
	defaultVariants: { tone: 'default' }
});
const defaultIndicatorDot = cva({ base: 'size-1.5 rounded-full bg-current' });
const defaultGroupIcon = defaultIndicator;
const defaultName = cva({ base: 'min-w-0 truncate font-medium text-neutral' });
const defaultSummary = cva({ base: 'min-w-0 flex-1 truncate text-neutral/60' });
// Trailing status word and duration. `ms-auto` keeps them at the row end when there is no summary.
const defaultMeta = cva({
	base: 'ms-auto flex shrink-0 items-center gap-sm text-xs text-neutral/60 tabular-nums'
});
const defaultStatusWord = cva({
	base: 'flex items-center gap-xs',
	variants: {
		tone: {
			active: '',
			awaiting: 'text-warning-readable',
			success: '',
			error: 'text-danger-readable',
			denied: '',
			cancelled: '',
			default: ''
		}
	},
	defaultVariants: { tone: 'default' }
});
const defaultStatus = cva({ base: 'ms-auto shrink-0' });
const defaultContent = cva({ base: 'grid min-w-0 gap-md' });
const defaultGroupContent = cva({
	base: 'min-w-0',
	variants: {
		variant: {
			card: 'border-t border-neutral-muted',
			ghost: '',
			outline: 'border-t border-neutral-muted',
			soft: 'border-t border-neutral/10'
		}
	},
	defaultVariants: { variant: 'ghost' }
});
// Input, output and error sections share one label style and no nested frames.
const defaultSection = cva({
	base: 'grid min-w-0 gap-xs',
	variants: {
		tone: {
			default: '',
			error: ''
		}
	}
});
const defaultLabel = cva({
	base: 'text-xs font-medium text-neutral/60',
	variants: {
		tone: {
			default: '',
			error: ''
		}
	},
	defaultVariants: { tone: 'default' }
});
const defaultErrorMessage = cva({
	base: 'min-w-0 rounded-sm bg-danger/5 px-md py-sm text-sm leading-relaxed break-words whitespace-pre-wrap text-danger-readable [overflow-wrap:anywhere] dark:bg-danger/10'
});
const defaultCode = cva({
	base: 'my-0 rounded-sm text-xs',
	variants: {
		tone: {
			default: '',
			error: 'border-danger/30'
		}
	}
});
const defaultCodeContainer = cva({
	base: 'text-xs leading-relaxed [&_pre]:!px-md [&_pre]:!py-sm'
});
// A long value collapses to `maxLines` with a bottom fade; "Show all" lifts the cap.
const defaultClamp = cva({
	base: 'relative min-w-0 text-xs leading-relaxed',
	variants: {
		collapsed: {
			true: 'overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]',
			false: ''
		}
	},
	defaultVariants: { collapsed: false }
});
const defaultShowAll = cva({ base: 'justify-self-start' });
const defaultEmpty = cva({ base: 'py-xs text-sm text-neutral/60' });
const defaultTree = cva({
	base: 'grid min-w-0 gap-xs rounded-sm border border-neutral-muted bg-surface p-md font-mono text-xs leading-relaxed',
	variants: {
		tone: {
			default: '',
			error: 'border-danger/30'
		}
	}
});
const defaultTreeNode = cva({ base: 'min-w-0' });
const defaultTreeBranch = cva({ base: 'flex min-w-0 items-baseline gap-md' });
const defaultTreeKey = cva({ base: 'max-w-[12rem] min-w-0 truncate text-neutral/60' });
const defaultTreeSummary = cva({ base: 'shrink-0 text-neutral/60' });
const defaultTreeChildren = cva({
	base: 'mt-xs ms-xs grid min-w-0 gap-xs border-s border-neutral-muted ps-lg'
});
const defaultTreeLeaf = cva({
	base: 'grid min-w-0 items-baseline gap-md',
	variants: {
		keyed: {
			true: 'grid-cols-[minmax(3rem,max-content)_minmax(0,1fr)]',
			false: 'grid-cols-1'
		}
	},
	defaultVariants: { keyed: true }
});
const defaultTreeValue = cva({
	base: 'min-w-0 break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
	variants: {
		kind: {
			string: 'text-neutral',
			number: 'text-neutral tabular-nums',
			boolean: 'text-primary-readable',
			null: 'text-neutral/60 italic',
			undefined: 'text-neutral/60 italic',
			empty: 'text-neutral/60 italic',
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
	summary: defaultSummary,
	meta: defaultMeta,
	statusWord: defaultStatusWord,
	status: defaultStatus,
	content: defaultContent,
	groupContent: defaultGroupContent,
	section: defaultSection,
	label: defaultLabel,
	errorMessage: defaultErrorMessage,
	code: defaultCode,
	codeContainer: defaultCodeContainer,
	clamp: defaultClamp,
	showAll: defaultShowAll,
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
export const setAIToolTheme = setComponentTheme<AIToolTheme>('ai-tool');
export const useAIToolTheme = useComponentTheme<AIToolTheme>('ai-tool', aiToolTheme);
