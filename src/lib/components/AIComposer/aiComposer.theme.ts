import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
// The composer is a raised card so it separates from whatever chat surface hosts it: its own
// raised fill, a hairline and a soft lift. It caps itself at `--ai-chat-content-width` when a host
// (AIChat) publishes one and centres in the remaining room; without the variable it spans its
// host. `@container` lets the editor and footer switch to touch ergonomics on a narrow composer.
// The focus ring follows the editor only, so focusing a footer control does not ring the card.
const defaultRoot = cva({
	base: '@container relative mx-auto grid w-full max-w-[var(--ai-chat-content-width,none)] min-w-0 grid-cols-[minmax(0,1fr)] gap-xs rounded-lg border border-neutral-muted bg-surface-raised p-sm lift-2 transition-colors has-[[data-slot=ai-composer-editor]:focus-within]:ring-2 has-[[data-slot=ai-composer-editor]:focus-within]:ring-focus/50',
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
	base: 'pointer-events-none absolute inset-1 z-20 flex items-center justify-center gap-md rounded-sm border border-dashed bg-surface/95 px-lg text-center text-sm font-medium lift-1',
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
			true: 'min-h-row-md',
			false: 'h-24 min-h-24'
		}
	}
});
const defaultToolbar = cva({ base: 'min-w-0' });
const defaultFile = cva({ base: 'shrink-0' });
const defaultError = cva({ base: 'min-w-0' });
// Rejected files are reported as a quiet inline note that dismisses itself, not as an alert.
const defaultNotice = cva({
	base: 'flex min-w-0 items-center justify-between gap-md px-sm text-xs text-danger-readable'
});
// On a narrow composer or a touch screen the footer controls grow to the 36px control height
// (the mic keeps its field height), so the targets are reachable with a thumb.
const defaultFooter = cva({
	base: 'flex min-w-0 items-center gap-md @max-md:[&_button:not([data-slot=ai-composer-voice-input]_button)]:h-control-lg pointer-coarse:[&_button:not([data-slot=ai-composer-voice-input]_button)]:h-control-lg'
});
// The start group (attach, footerStart) may shrink; the end group (model, voice, queue,
// stop/send) keeps priority so the send position never leaves the composer.
const defaultActions = cva({
	base: 'flex items-center gap-xs',
	variants: {
		side: {
			start: 'min-w-0 shrink',
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
	base: 'flex min-w-0 items-center justify-between gap-md rounded-sm bg-neutral-muted/50 px-md py-xs text-sm text-neutral/70'
});
// One `minmax(0, 1fr)` track: an `auto` track grows to a long message's width and pushes the row
// actions past the composer edge instead of truncating the preview.
const defaultQueueList = cva({ base: 'grid grid-cols-[minmax(0,1fr)] gap-xs [&>*]:min-w-0' });
const defaultQueueItem = cva({
	base: 'flex min-w-0 flex-1 items-center gap-md',
	variants: { steered: { true: '', false: '' } },
	defaultVariants: { steered: false }
});
const defaultQueueBadge = cva({
	base: 'shrink-0 rounded-sm bg-primary-muted px-sm text-xs font-medium text-primary-muted-readable'
});
const defaultQueueFiles = cva({ base: 'shrink-0 text-xs text-neutral/70' });
const defaultQueueText = cva({ base: 'min-w-0 flex-1 truncate text-sm text-neutral/70' });
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
	notice: defaultNotice,
	footer: defaultFooter,
	actions: defaultActions,
	voiceInput: defaultVoiceInput,
	queue: defaultQueue,
	queueEditing: defaultQueueEditing,
	queueList: defaultQueueList,
	queueItem: defaultQueueItem,
	queueBadge: defaultQueueBadge,
	queueFiles: defaultQueueFiles,
	queueText: defaultQueueText
};
export type AIComposerTheme = typeof aiComposerTheme;
export type AIComposerThemeProps = InferComponentTheme<AIComposerTheme>;
export const setAIComposerTheme = setComponentTheme<AIComposerTheme>('ai-composer');
export const useAIComposerTheme = useComponentTheme<AIComposerTheme>(
	'ai-composer',
	aiComposerTheme
);
