import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultRichTextInputRoot = cva({
	base: 'text-neutral min-w-0 w-full',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		disabled: {
			true: 'opacity-60',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultRichTextInputInputContainer = cva({
	base: 'block w-full min-w-0',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		disabled: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultRichTextInputFixedToolbar = cva({
	base: 'border-neutral-muted bg-surface-raised/70 mb-md flex min-w-0 items-center overflow-x-auto rounded-md border p-xs',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-xs'
		},
		standalone: {
			true: 'mb-xs rounded-none border-0 bg-transparent p-0',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		standalone: false
	}
});

const defaultRichTextInputViewport = cva({
	base: 'min-w-0',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultRichTextInputScrollArea = cva({
	base: 'group/rich-text-input flex min-w-0 flex-col overflow-hidden rounded-md border border-neutral-muted bg-surface-raised text-neutral transition-all focus-within:ring-2 focus-within:ring-primary/50',
	variants: {
		size: {
			small: 'max-h-40 min-h-20',
			normal: 'max-h-48 min-h-24',
			large: 'max-h-64 min-h-32'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-60',
			false: ''
		},
		standalone: {
			true: 'rounded-none border-0 bg-transparent focus-within:ring-0',
			false: ''
		},
		height: {
			default: '',
			custom: '!max-h-[var(--rich-text-input-max-height)]',
			uncapped: '!max-h-none'
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false,
		standalone: false,
		height: 'default'
	}
});

const defaultRichTextInputEditorShell = cva({
	base: 'relative min-w-0',
	variants: {
		size: {
			small: 'p-md',
			normal: 'p-lg',
			large: 'p-xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const richTextInputMarkdownContent =
	'[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-medium [&_a]:text-primary-readable [&_a]:underline [&_blockquote]:my-md [&_blockquote]:border-l-4 [&_blockquote]:border-neutral/30 [&_blockquote]:pl-xl [&_blockquote]:italic [&_blockquote]:text-neutral/60 [&_code]:rounded-sm [&_code]:bg-surface-canvas [&_code]:px-sm [&_code]:py-micro [&_code]:font-mono [&_code]:text-xs [&_code]:text-neutral [&_del]:text-neutral/60 [&_em]:italic [&_h1]:mb-sm [&_h1]:mt-xl [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-neutral [&_h2]:mb-sm [&_h2]:mt-xl [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral [&_h3]:mb-sm [&_h3]:mt-xl [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral [&_li]:py-0 [&_mark]:rounded-sm [&_mark]:bg-warning-muted [&_mark]:text-warning-muted-readable [&_ol]:my-md [&_ol]:ml-lg [&_ol]:list-inside [&_ol]:list-decimal [&_ol]:whitespace-normal [&_p]:my-md [&_p]:text-neutral [&_strong]:font-semibold [&_ul]:my-md [&_ul]:ml-lg [&_ul]:list-inside [&_ul]:list-disc [&_ul]:whitespace-normal';

const defaultRichTextInputEditor = cva({
	base: `min-w-0 whitespace-pre-wrap break-words outline-none ${richTextInputMarkdownContent}`,
	variants: {
		size: {
			small: 'min-h-16 text-xs leading-normal',
			normal: 'min-h-18 text-sm leading-normal',
			large: 'min-h-24 text-base leading-normal'
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultRichTextInputPlaceholder = cva({
	base: 'text-neutral/60 pointer-events-none absolute',
	variants: {
		size: {
			small: 'left-2 top-2 text-xs leading-normal',
			normal: 'left-3 top-3 text-sm leading-normal',
			large: 'left-4 top-4 text-base leading-normal'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputScrollComfortSpacer = cva({
	base: 'pointer-events-none w-full shrink-0',
	variants: {
		size: {
			small: 'h-8',
			normal: 'h-10',
			large: 'h-12'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputFloatingPanel = cva({
	base: 'border-neutral-muted bg-surface-floating isolate overflow-hidden rounded-md border text-neutral shadow-md',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		width: {
			toolbar: 'w-fit',
			suggestions: 'w-72'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputFormattingToolbar = cva({
	base: 'flex min-w-0 max-w-full items-center gap-micro',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultRichTextInputFormattingToolbarRail = cva({
	base: 'flex min-w-0 items-center gap-xs overflow-hidden whitespace-nowrap',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultRichTextInputToolbarButton = cva({
	base: 'shrink-0',
	variants: {
		size: {
			small: '!size-6 !min-w-6',
			normal: '!size-7 !min-w-7',
			large: '!size-8 !min-w-8'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputToolbarIcon = cva({
	base: 'shrink-0',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-4.5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputToolbarSeparator = cva({
	base: 'bg-neutral-muted mx-xs h-5 w-px shrink-0',
	variants: {
		size: {
			small: 'h-4',
			normal: 'h-5',
			large: 'h-5'
		}
	}
});

const defaultRichTextInputLinkForm = cva({
	base: 'flex min-w-0 items-center gap-xs',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultRichTextInputLinkInput = cva({
	base: 'border-neutral-muted bg-surface-raised text-neutral placeholder:text-neutral/60 min-w-0 flex-1 rounded-md border outline-none focus:ring-2 focus:ring-primary/50',
	variants: {
		size: {
			small: 'h-control-sm w-44 px-md text-xs',
			normal: 'h-control-md w-56 px-md text-sm',
			large: 'h-control-lg w-64 px-lg text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRichTextInputSuggestionsStatus = cva({
	base: 'border-neutral-muted text-neutral/60 border-t px-md py-sm',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		status: {
			loading: '',
			error: 'text-danger-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		status: 'loading'
	}
});

const defaultRichTextInputSuggestionsError = cva({
	base: 'text-danger-readable'
});

export const richTextInputTheme = {
	root: defaultRichTextInputRoot,
	inputContainer: defaultRichTextInputInputContainer,
	fixedToolbar: defaultRichTextInputFixedToolbar,
	viewport: defaultRichTextInputViewport,
	scrollArea: defaultRichTextInputScrollArea,
	editorShell: defaultRichTextInputEditorShell,
	editor: defaultRichTextInputEditor,
	placeholder: defaultRichTextInputPlaceholder,
	scrollComfortSpacer: defaultRichTextInputScrollComfortSpacer,
	floatingPanel: defaultRichTextInputFloatingPanel,
	formattingToolbar: defaultRichTextInputFormattingToolbar,
	formattingToolbarRail: defaultRichTextInputFormattingToolbarRail,
	toolbarButton: defaultRichTextInputToolbarButton,
	toolbarIcon: defaultRichTextInputToolbarIcon,
	toolbarSeparator: defaultRichTextInputToolbarSeparator,
	linkForm: defaultRichTextInputLinkForm,
	linkInput: defaultRichTextInputLinkInput,
	suggestionsStatus: defaultRichTextInputSuggestionsStatus,
	suggestionsError: defaultRichTextInputSuggestionsError
};

export type RichTextInputTheme = typeof richTextInputTheme;
export type RichTextInputThemeProps = InferComponentTheme<RichTextInputTheme>;
export const setRichTextInputTheme = setComponentTheme<RichTextInputTheme>('richTextInput');
export const useRichTextInputTheme = useComponentTheme('richTextInput', richTextInputTheme);
