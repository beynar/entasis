import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({
	base: 'relative grid min-w-0 grid-cols-[minmax(0,1fr)] gap-xs rounded-md border border-neutral-muted bg-surface p-sm transition-colors focus-within:ring-2 focus-within:ring-primary/30',
	variants: {
		dragState: {
			idle: '',
			potential: 'border-primary bg-primary/5',
			valid: 'border-primary bg-primary/5',
			invalid: 'border-danger bg-danger/5'
		}
	}
});
const defaultDropzone = cva({
	base: 'pointer-events-none absolute inset-1 z-20 flex items-center justify-center gap-md rounded-sm border border-dashed bg-surface/95 px-lg text-center text-sm font-medium shadow-sm',
	variants: {
		state: {
			idle: '',
			potential: 'border-primary text-primary-readable',
			valid: 'border-primary text-primary-readable',
			invalid: 'border-danger text-danger-readable'
		}
	}
});
const defaultDropzoneIcon = cva({ base: 'shrink-0' });
const defaultHeader = cva({ base: 'min-w-0' });
const defaultFiles = cva({ base: 'flex w-max min-w-full gap-md py-xs' });
const defaultBody = cva({ base: 'min-w-0' });
const defaultEditor = cva({
	base: 'py-xs',
	variants: {
		autoresize: {
			true: 'min-h-10',
			false: 'h-24 min-h-24'
		}
	}
});
const defaultToolbar = cva({ base: 'min-w-0' });
const defaultFile = cva({ base: 'shrink-0' });
const defaultError = cva({ base: 'min-w-0' });
const defaultFooter = cva({ base: 'flex min-w-0 items-center gap-md' });
const defaultActions = cva({
	base: 'flex items-center gap-xs',
	variants: {
		side: {
			start: 'shrink-0',
			end: 'ml-auto min-w-0 flex-1 justify-end'
		}
	},
	defaultVariants: { side: 'start' }
});
const defaultVoiceInput = cva({
	base: 'min-w-0',
	variants: {
		variant: {
			compact: 'shrink-0',
			expandable: 'flex min-w-0 flex-1 justify-end'
		}
	},
	defaultVariants: { variant: 'compact' }
});
const defaultQueue = cva({ base: 'grid gap-xs border-b border-neutral-muted pb-md' });
const defaultQueueEditing = cva({
	base: 'flex min-w-0 items-center justify-between gap-md rounded-sm bg-neutral-muted/50 px-md py-xs text-sm text-neutral/75'
});
const defaultQueueList = cva({ base: 'grid gap-xs' });
const defaultQueueItem = cva({ base: 'flex min-w-0 flex-1 items-center gap-md' });
const defaultQueueText = cva({ base: 'min-w-0 flex-1 truncate text-sm text-neutral/75' });
export const aiComposerTheme = {
	root: defaultRoot,
	dropzone: defaultDropzone,
	dropzoneIcon: defaultDropzoneIcon,
	header: defaultHeader,
	files: defaultFiles,
	body: defaultBody,
	editor: defaultEditor,
	toolbar: defaultToolbar,
	file: defaultFile,
	error: defaultError,
	footer: defaultFooter,
	actions: defaultActions,
	voiceInput: defaultVoiceInput,
	queue: defaultQueue,
	queueEditing: defaultQueueEditing,
	queueList: defaultQueueList,
	queueItem: defaultQueueItem,
	queueText: defaultQueueText
};
export type AIComposerTheme = typeof aiComposerTheme;
export type AIComposerThemeProps = InferComponentTheme<AIComposerTheme>;
export const setAIComposerTheme = setComponentTheme<AIComposerTheme>('aiComposer');
export const useAIComposerTheme = useComponentTheme<AIComposerTheme>('aiComposer', aiComposerTheme);
