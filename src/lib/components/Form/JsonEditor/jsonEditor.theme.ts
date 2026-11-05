import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultInputContainer = cva({
	base: 'flex min-w-0 w-full flex-col'
});

const defaultRoot = cva({
	base: 'flex min-w-0 w-full flex-col rounded-md border border-neutral-muted bg-surface-raised text-neutral outline-none',
	variants: {
		// The controls dim themselves; this dims what is around them.
		disabled: {
			true: 'bg-surface text-neutral/70',
			false: ''
		},
		invalid: {
			true: 'border-danger/50',
			false: ''
		}
	},
	defaultVariants: {
		disabled: false,
		invalid: false
	}
});

const defaultToolbar = cva({
	base: 'flex min-w-0 items-center justify-between gap-sm border-b border-neutral-muted',
	variants: {
		size: {
			small: 'px-sm py-xs',
			normal: 'px-sm py-xs',
			large: 'px-md py-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultToolbarGroup = cva({
	base: 'flex min-w-0 items-center gap-micro'
});

const defaultToolbarButton = cva({
	base: 'state-layer inline-flex shrink-0 items-center justify-center rounded-sm text-neutral/70 outline-none transition-[color,background-color,box-shadow] hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		size: {
			small: 'size-6',
			normal: 'size-7',
			large: 'size-8'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultIssueCount = cva({
	base: 'state-layer ms-xs inline-flex items-center gap-xs rounded-sm px-xs font-medium text-danger-readable tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-xs',
			large: 'h-control-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultTree = cva({
	base: 'flex min-w-0 flex-col',
	variants: {
		size: {
			small: 'p-xs',
			normal: 'p-xs',
			large: 'p-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRows = cva({
	base: 'flex min-w-0 flex-col'
});

// Every row shares its columns, whatever its depth: the key column holds the indentation, so values
// line up down the whole tree and a deep key is what gives way, not its value.
const defaultRow = cva({
	base: 'group/json-row relative grid min-w-0 grid-cols-[minmax(0,38%)_minmax(0,1fr)_auto] items-start rounded-sm',
	variants: {
		density: {
			compact: 'gap-x-xs',
			normal: 'gap-x-xs',
			comfortable: 'gap-x-sm'
		},
		bare: {
			true: 'grid-cols-[auto_minmax(0,1fr)_auto]',
			false: ''
		}
	},
	defaultVariants: {
		density: 'normal',
		bare: false
	}
});

const defaultKey = cva({
	base: 'flex min-w-0 self-stretch'
});

// One per level above the row: stretched to the row's full height, so the lines run unbroken past
// tall rows, descriptions and errors.
const defaultGuide = cva({
	base: 'relative flex shrink-0 items-start justify-center',
	variants: {
		size: {
			small: 'w-3.5',
			normal: 'w-4',
			large: 'w-4'
		},
		line: {
			true: 'before:pointer-events-none before:absolute before:inset-y-0 before:start-1/2 before:w-px before:bg-neutral-muted',
			false: ''
		},
		// The line steps aside while the grip on it shows.
		handle: {
			true: 'group-hover/json-row:before:opacity-0 group-focus-within/json-row:before:opacity-0',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		line: true,
		handle: false
	}
});

// Rows have no gap and no padding of their own: the space is inside the cells, so the guide lines
// beside them run from one row into the next without a break.
const defaultKeyContent = cva({
	base: 'flex min-w-0 flex-1 items-center gap-micro',
	variants: {
		size: {
			small: 'h-control-sm',
			normal: 'h-control-md',
			large: 'h-control-lg'
		},
		density: {
			compact: '',
			normal: 'my-micro',
			comfortable: 'my-xs'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

// Ends the line, beside the remove button and the same size: it stays where it is, whatever the row says.
const defaultToggle = cva({
	base: 'state-layer ms-auto inline-flex shrink-0 items-center justify-center rounded-sm text-neutral/70 outline-none transition-[color,transform] duration-fast hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50 motion-reduce:transition-none',
	variants: {
		size: {
			small: 'size-5',
			normal: 'size-6',
			large: 'size-7'
		},
		open: {
			true: 'rotate-180',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		open: false
	}
});

// Sits on its row's guide line, in the slot beside the row's chevron: hidden until the row is in use,
// so a list reads as plain rows.
const defaultHandle = cva({
	base: 'relative z-10 inline-flex w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-neutral/45 opacity-0 outline-none transition-[color,opacity] hover:text-neutral focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-focus/50 active:cursor-grabbing group-hover/json-row:opacity-100 group-focus-within/json-row:opacity-100 pointer-coarse:opacity-100',
	variants: {
		size: {
			small: 'h-control-sm',
			normal: 'h-control-md',
			large: 'h-control-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultTypeIcon = cva({
	base: 'inline-flex shrink-0 items-center justify-center rounded-sm text-neutral/45',
	variants: {
		size: {
			small: 'size-4',
			normal: 'size-5',
			large: 'size-5'
		},
		changeable: {
			true: 'state-layer cursor-pointer outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		changeable: false
	}
});

const defaultKeyLabel = cva({
	base: 'min-w-0 truncate text-neutral',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		index: {
			true: 'font-mono text-neutral/70 tabular-nums',
			false: ''
		},
		deprecated: {
			true: 'line-through decoration-neutral/50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		index: false,
		deprecated: false
	}
});

// Pulled back by its padding, so a key the user named starts where a declared one does.
const defaultKeyInput = cva({
	base: '-ms-xs min-w-0 flex-1 appearance-none rounded-sm border border-transparent bg-transparent px-xs text-neutral outline-none transition-[border-color,background-color,box-shadow] placeholder:text-neutral/70 hover:border-neutral-muted focus:border-neutral-muted focus:bg-surface-raised focus:ring-2 focus:ring-focus/50 read-only:hover:border-transparent',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-sm',
			large: 'h-control-md text-sm'
		},
		invalid: {
			true: 'border-danger text-danger-readable hover:border-danger focus:border-danger',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		invalid: false
	}
});

const defaultRequired = cva({
	base: 'shrink-0 font-bold text-danger-readable',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultInfo = cva({
	base: 'inline-flex shrink-0 cursor-help items-center justify-center rounded-sm text-neutral/45 outline-none hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50'
});

const defaultValueCell = cva({
	base: 'flex min-w-0 flex-col justify-center',
	variants: {
		density: {
			compact: '',
			normal: 'py-micro',
			comfortable: 'py-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// At least as tall as a control, so a short one (a Switch, a constant) centres on its key.
const defaultValueRow = cva({
	base: 'flex min-w-0 items-center gap-xs',
	variants: {
		size: {
			small: 'min-h-[var(--control-height-sm)]',
			normal: 'min-h-[var(--control-height-md)]',
			large: 'min-h-[var(--control-height-lg)]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultSummary = cva({
	base: 'flex min-w-0 flex-1 items-center gap-xs text-neutral/70',
	variants: {
		size: {
			small: 'h-control-sm text-xs',
			normal: 'h-control-md text-xs',
			large: 'h-control-lg text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultPreview = cva({
	base: 'min-w-0 truncate font-mono text-neutral/45'
});

const defaultNestedIssues = cva({
	base: 'inline-flex shrink-0 items-center gap-micro font-medium text-danger-readable tabular-nums'
});

const defaultFixedValue = cva({
	base: 'inline-flex min-w-0 max-w-full items-center gap-xs truncate rounded-sm bg-neutral-muted/60 px-sm font-mono text-neutral/70',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-xs',
			large: 'h-control-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultSetButton = cva({
	base: 'state-layer inline-flex items-center gap-xs rounded-sm px-xs text-neutral/70 outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-xs',
			large: 'h-control-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVariantSelect = cva({
	base: 'w-auto max-w-[45%] shrink-0'
});

const defaultActions = cva({
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'h-control-sm w-6',
			normal: 'h-control-md w-7',
			large: 'h-control-lg w-8'
		},
		density: {
			compact: '',
			normal: 'my-micro',
			comfortable: 'my-xs'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultRemoveButton = cva({
	base: 'state-layer inline-flex items-center justify-center rounded-sm text-neutral/45 opacity-0 outline-none transition-[color,opacity] hover:text-danger-readable focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-focus/50 group-hover/json-row:opacity-100 group-focus-within/json-row:opacity-100 pointer-coarse:opacity-100',
	variants: {
		size: {
			small: 'size-5',
			normal: 'size-6',
			large: 'size-7'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAddRow = cva({
	base: 'flex min-w-0 items-stretch'
});

// Beside the count of an object: new keys without a row of their own for each nested object.
const defaultInlineAdd = cva({
	base: 'state-layer inline-flex shrink-0 items-center justify-center rounded-sm text-neutral/45 outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'size-5',
			normal: 'size-6',
			large: 'size-7'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAddButton = cva({
	base: 'state-layer my-micro inline-flex items-center gap-xs rounded-sm px-xs text-neutral/70 outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-xs',
			large: 'h-control-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultEmpty = cva({
	base: 'my-micro flex items-center italic text-neutral/70',
	variants: {
		size: {
			small: 'h-6 text-xs',
			normal: 'h-control-sm text-xs',
			large: 'h-control-md text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultDescription = cva({
	base: 'text-neutral/70 text-xs leading-snug'
});

const defaultRowError = cva({
	base: 'text-xs leading-snug text-danger-readable'
});

const defaultRaw = cva({
	base: 'flex min-w-0 flex-col gap-xs p-xs'
});

const defaultRawIssues = cva({
	base: 'flex flex-col gap-micro px-xs pb-xs'
});

const defaultRawIssue = cva({
	base: 'flex min-w-0 gap-sm text-xs leading-snug text-danger-readable'
});

const defaultRawIssuePath = cva({
	base: 'shrink-0 font-mono text-neutral/70'
});

const defaultDateTime = cva({
	base: 'flex min-w-0 w-full items-start gap-xs'
});

/**
 * The Field of a control in a row: its label stays for assistive technology while the key column is
 * what shows, and a problem rings the control without crowding the rows around it.
 */
export const jsonEditorFieldTheme = {
	header: { base: 'absolute sr-only' },
	errorsContainer: { base: 'mt-micro' },
	error: { base: 'leading-snug text-xs' },
	description: { base: 'text-xs leading-snug text-neutral/70' },
	inputContainer: { hasError: { true: '!ring-1 !ring-offset-0 !ring-danger' } }
};

/** SortableList gives the order; a row of the tree stays a row, with no card around it. */
export const jsonEditorListTheme = {
	root: { size: { normal: 'gap-0' } },
	item: {
		base: 'block rounded-none border-0 bg-transparent',
		size: { normal: 'gap-0 p-0 text-inherit' },
		// A list that cannot move is still being read and edited.
		disabled: { true: 'cursor-auto opacity-100' }
	}
};

export const jsonEditorTheme = {
	inputContainer: defaultInputContainer,
	root: defaultRoot,
	toolbar: defaultToolbar,
	toolbarGroup: defaultToolbarGroup,
	toolbarButton: defaultToolbarButton,
	issueCount: defaultIssueCount,
	tree: defaultTree,
	rows: defaultRows,
	row: defaultRow,
	key: defaultKey,
	guide: defaultGuide,
	keyContent: defaultKeyContent,
	toggle: defaultToggle,
	handle: defaultHandle,
	typeIcon: defaultTypeIcon,
	keyLabel: defaultKeyLabel,
	keyInput: defaultKeyInput,
	required: defaultRequired,
	info: defaultInfo,
	valueCell: defaultValueCell,
	valueRow: defaultValueRow,
	summary: defaultSummary,
	preview: defaultPreview,
	nestedIssues: defaultNestedIssues,
	fixedValue: defaultFixedValue,
	setButton: defaultSetButton,
	variantSelect: defaultVariantSelect,
	actions: defaultActions,
	removeButton: defaultRemoveButton,
	dateTime: defaultDateTime,
	addRow: defaultAddRow,
	inlineAdd: defaultInlineAdd,
	addButton: defaultAddButton,
	empty: defaultEmpty,
	description: defaultDescription,
	rowError: defaultRowError,
	raw: defaultRaw,
	rawIssues: defaultRawIssues,
	rawIssue: defaultRawIssue,
	rawIssuePath: defaultRawIssuePath
};

export type JsonEditorTheme = typeof jsonEditorTheme;
export type JsonEditorThemeProps = InferComponentTheme<JsonEditorTheme>;
export const setJsonEditorTheme = setComponentTheme<JsonEditorTheme>('json-editor');
export const useJsonEditorTheme = useComponentTheme<JsonEditorTheme>(
	'json-editor',
	jsonEditorTheme
);
