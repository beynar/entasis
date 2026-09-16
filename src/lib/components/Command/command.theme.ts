import { selectedSoft } from '$lib/components/Theme/theme.recipes.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// A palette is sized by whatever hosts it — a `max-w-xl` dialog, an 18rem mention popover, an
// inline card — so it reads its OWN width rather than the viewport. `@container` is safe on the
// root because it is always `w-full`/`h-full` inside a host with a definite width; it never sizes
// to its own content. Breakpoint: `@sm` (>= 24rem / 384px) is where an item row still has room for
// its label after the right-aligned shortcut; a phone-width palette (~21.5rem) stays below it and
// hides the shortcut.
const defaultCommand = cva({
	base: '@container bg-transparent text-neutral flex h-full w-full flex-col overflow-hidden rounded-lg p-xs',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandInputWrapper = cva({
	base: 'p-xs pb-0',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandInputGroup = cva({
	base: 'flex items-center gap-md px-md',
	variants: {
		size: {
			small: 'h-control-sm',
			normal: 'h-control-md',
			large: 'h-control-lg'
		}
	}
});

const defaultCommandInputIcon = cva({
	base: 'shrink-0 opacity-50',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-4.5'
		}
	}
});

const defaultCommandInput = cva({
	base: 'placeholder:text-neutral/70 w-full min-w-0 flex-1 bg-transparent outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultCommandList = cva({
	base: 'scrollbar scrollbar-none max-h-72 flex-1 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandEmpty = cva({
	base: 'py-layout-md text-center',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultCommandGroup = cva({
	base: 'text-neutral overflow-hidden p-xs',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandGroupHeading = cva({
	base: 'text-neutral/70 font-medium',
	variants: {
		size: {
			small: 'px-md py-xs text-xs',
			normal: 'px-md py-sm text-xs',
			large: 'px-md py-md text-sm'
		}
	}
});

const defaultCommandSeparator = cva({
	base: '-mx-xs h-px',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandItem = cva({
	base: '',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		highlighted: {
			// The keyboard cursor is a persistent selection, not a hover: it paints the shared soft
			// selected recipe in the current role, like a sidebar row or a toggle button.
			true: selectedSoft,
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		highlighted: false
	}
});

const defaultCommandShortcut = cva({
	base: 'ml-auto hidden tracking-widest @sm:inline',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		highlighted: {
			true: 'text-current/70',
			false: 'text-neutral/70'
		}
	},
	defaultVariants: {
		size: 'normal',
		highlighted: false
	}
});

const defaultCommandFooter = cva({
	// Bleeds the panel's p-xs so a border-t footer spans edge-to-edge; the panel's
	// overflow-hidden + rounded-lg clip its bottom corners.
	base: '-mx-xs -mb-xs',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultCommandTrigger = cva({
	base: 'contents'
});

export const commandTheme = {
	root: defaultCommand,
	inputWrapper: defaultCommandInputWrapper,
	inputGroup: defaultCommandInputGroup,
	inputIcon: defaultCommandInputIcon,
	input: defaultCommandInput,
	list: defaultCommandList,
	empty: defaultCommandEmpty,
	group: defaultCommandGroup,
	groupHeading: defaultCommandGroupHeading,
	separator: defaultCommandSeparator,
	item: defaultCommandItem,
	shortcut: defaultCommandShortcut,
	footer: defaultCommandFooter,
	trigger: defaultCommandTrigger
};

export type CommandTheme = typeof commandTheme;
export type CommandThemeProps = InferComponentTheme<CommandTheme>;
export const setCommandTheme = setComponentTheme<CommandTheme>('command');
export const useCommandTheme = useComponentTheme<CommandTheme>('command', commandTheme);
