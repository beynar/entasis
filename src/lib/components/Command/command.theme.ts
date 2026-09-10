import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultCommand = cva({
	base: 'bg-surface text-neutral flex h-full w-full flex-col overflow-hidden rounded-lg p-xs',
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
			small: 'h-7',
			normal: 'h-8',
			large: 'h-9'
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
	base: 'placeholder:text-neutral/60 w-full min-w-0 flex-1 bg-transparent outline-none',
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
	base: 'text-neutral/60 font-medium',
	variants: {
		size: {
			small: 'px-md py-xs text-[0.6875rem]',
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

const defaultCommandShortcut = cva({
	base: 'ml-auto hidden tracking-widest sm:inline',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
		},
		highlighted: {
			true: 'text-neutral',
			false: 'text-neutral/60'
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
	shortcut: defaultCommandShortcut,
	footer: defaultCommandFooter,
	trigger: defaultCommandTrigger
};

export type CommandTheme = typeof commandTheme;
export type CommandThemeProps = InferComponentTheme<CommandTheme>;
export const setCommandTheme = setComponentTheme<CommandTheme>('command');
export const useCommandTheme = useComponentTheme<CommandTheme>('command', commandTheme);
