import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'min-w-0',
	variants: {
		variant: {
			default: 'w-full',
			expandable: null,
			compact: 'w-fit'
		},
		expanded: {
			true: null,
			false: null
		}
	},
	compoundVariants: [
		{ variant: 'expandable', expanded: true, class: 'w-full' },
		{ variant: 'expandable', expanded: false, class: 'w-fit' }
	],
	defaultVariants: {
		variant: 'default',
		expanded: true
	}
});

const defaultInputContainer = cva({
	base: 'relative ml-auto flex w-full min-w-0 items-center overflow-hidden rounded-md border border-neutral-muted bg-surface-raised px-lg transition-[max-width,background-color,border-color,box-shadow] duration-slow ease-standard motion-reduce:transition-none focus-within:border-color/60 focus-within:ring-2 focus-within:ring-focus/50',
	variants: {
		// One row height in every state (idle waveform, recording, error text, playback) and no
		// vertical padding, so the edge action fills the box from top to bottom.
		size: {
			small: 'min-h-row-sm gap-sm',
			normal: 'min-h-row-md gap-md',
			large: 'min-h-row-lg gap-md'
		},
		recording: {
			true: 'border-color/50',
			false: null
		},
		playback: {
			true: null,
			false: null
		},
		error: {
			true: 'border-danger focus-within:border-danger focus-within:ring-danger/50',
			false: null
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: null
		},
		variant: {
			default: 'max-w-full',
			expandable: null,
			compact: null
		},
		expanded: {
			true: null,
			false: null
		}
	},
	compoundVariants: [
		{ variant: 'expandable', expanded: true, class: 'max-w-full' },
		{ variant: 'expandable', expanded: false, class: 'gap-0' },
		{ variant: 'compact', expanded: true, class: 'max-w-full' },
		{
			variant: 'compact',
			expanded: false,
			class: 'gap-0 overflow-visible rounded-full border-0 bg-transparent px-0 py-0'
		},
		{
			variant: 'expandable',
			expanded: false,
			size: 'small',
			class: 'max-w-[calc(2rem+2px)] border-transparent bg-transparent px-0'
		},
		{
			variant: 'expandable',
			expanded: false,
			size: 'normal',
			class: 'max-w-[calc(2.25rem+2px)] border-transparent bg-transparent px-0'
		},
		{
			variant: 'expandable',
			expanded: false,
			size: 'large',
			class: 'max-w-[calc(2.5rem+2px)] border-transparent bg-transparent px-0'
		},
		{
			variant: 'compact',
			expanded: false,
			size: 'small',
			class: 'min-h-8 max-w-8'
		},
		{
			variant: 'compact',
			expanded: false,
			size: 'normal',
			class: 'min-h-9 max-w-9'
		},
		{
			variant: 'compact',
			expanded: false,
			size: 'large',
			class: 'min-h-10 max-w-10'
		},
		{
			variant: 'compact',
			expanded: false,
			playback: true,
			size: 'small',
			class: 'max-w-24'
		},
		{
			variant: 'compact',
			expanded: false,
			playback: true,
			size: 'normal',
			class: 'max-w-[6.75rem]'
		},
		{
			variant: 'compact',
			expanded: false,
			playback: true,
			size: 'large',
			class: 'max-w-[7.5rem]'
		}
	],
	defaultVariants: {
		size: 'normal',
		recording: false,
		playback: false,
		error: false,
		disabled: false,
		variant: 'default',
		expanded: true
	}
});

const defaultContent = cva({
	base: 'flex min-w-0 flex-1 items-center overflow-hidden transition-[opacity,transform] duration-normal ease-standard motion-reduce:transition-none',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		},
		variant: {
			default: null,
			expandable: null,
			compact: null
		},
		expanded: {
			true: null,
			false: null
		}
	},
	compoundVariants: [
		{
			variant: 'expandable',
			expanded: false,
			class: 'pointer-events-none basis-0 translate-x-2 opacity-0'
		},
		{
			variant: 'expandable',
			expanded: true,
			class: 'translate-x-0 opacity-100 delay-75'
		}
	],
	defaultVariants: {
		size: 'normal',
		variant: 'default',
		expanded: true
	}
});

const defaultAction = cva({
	variants: {
		size: {
			small: null,
			normal: null,
			large: null
		},
		variant: {
			default: null,
			expandable: null,
			compact: null
		},
		recording: {
			true: null,
			false: null
		},
		expanded: {
			true: null,
			false: null
		}
	},
	compoundVariants: [
		// A collapsed expandable input is the mic alone: a regular ghost button, not the flush,
		// square edge action it becomes once the field opens around it.
		{ variant: 'expandable', expanded: false, class: '!m-0 !self-auto !rounded-md' },
		{ variant: 'expandable', expanded: false, size: 'small', class: '!size-8' },
		{ variant: 'expandable', expanded: false, size: 'normal', class: '!size-9' },
		{ variant: 'expandable', expanded: false, size: 'large', class: '!size-10' },
		{
			variant: 'compact',
			recording: true,
			class: '!border-color !bg-color !text-color-contrast lift-1'
		},
		// Compact is a round mic with level rings while collapsed; it only expands to show an
		// error, and then takes the flush edge like every other field action.
		{
			variant: 'compact',
			expanded: false,
			class:
				'relative isolate !m-0 !self-auto !rounded-full !overflow-visible before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-full before:border before:border-color/55 before:[opacity:calc(var(--voice-input-level)*0.7)] before:[transform:scale(calc(1+var(--voice-input-level)*0.55))] before:transition-[transform,opacity] before:duration-fast before:ease-standard before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-full after:border after:border-color/30 after:[opacity:calc(var(--voice-input-level)*0.45)] after:[transform:scale(calc(1+var(--voice-input-level)*1.05))] after:transition-[transform,opacity] after:duration-normal after:ease-standard after:content-[""] motion-reduce:before:transition-none motion-reduce:after:transition-none'
		},
		{ variant: 'compact', expanded: false, size: 'small', class: '!size-8' },
		{ variant: 'compact', expanded: false, size: 'normal', class: '!size-9' },
		{ variant: 'compact', expanded: false, size: 'large', class: '!size-10' }
	],
	defaultVariants: {
		size: 'normal',
		variant: 'default',
		recording: false,
		expanded: true
	}
});

const defaultPlaybackAction = cva({
	variants: {
		size: {
			small: null,
			normal: null,
			large: null
		},
		variant: {
			default: null,
			expandable: null,
			compact: '!m-0 !self-auto !rounded-full'
		},
		playing: {
			true: 'bg-color-muted text-color-muted-readable',
			false: null
		}
	},
	compoundVariants: [
		// Compact is a round mic with level rings while collapsed; it only expands to show an
		// error, and then takes the flush edge like every other field action.
		{
			variant: 'compact',
			expanded: false,
			class:
				'relative isolate !m-0 !self-auto !rounded-full !overflow-visible before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-full before:border before:border-color/55 before:[opacity:calc(var(--voice-input-level)*0.7)] before:[transform:scale(calc(1+var(--voice-input-level)*0.55))] before:transition-[transform,opacity] before:duration-fast before:ease-standard before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-full after:border after:border-color/30 after:[opacity:calc(var(--voice-input-level)*0.45)] after:[transform:scale(calc(1+var(--voice-input-level)*1.05))] after:transition-[transform,opacity] after:duration-normal after:ease-standard after:content-[""] motion-reduce:before:transition-none motion-reduce:after:transition-none'
		},
		{ variant: 'compact', expanded: false, size: 'small', class: '!size-8' },
		{ variant: 'compact', expanded: false, size: 'normal', class: '!size-9' },
		{ variant: 'compact', expanded: false, size: 'large', class: '!size-10' }
	],
	defaultVariants: {
		size: 'normal',
		variant: 'default',
		playing: false
	}
});

const defaultClearAction = cva({
	variants: {
		size: {
			small: null,
			normal: null,
			large: null
		},
		variant: {
			default: null,
			expandable: null,
			compact: '!m-0 !self-auto !rounded-full'
		}
	},
	compoundVariants: [
		// Compact is a round mic with level rings while collapsed; it only expands to show an
		// error, and then takes the flush edge like every other field action.
		{
			variant: 'compact',
			expanded: false,
			class:
				'relative isolate !m-0 !self-auto !rounded-full !overflow-visible before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-full before:border before:border-color/55 before:[opacity:calc(var(--voice-input-level)*0.7)] before:[transform:scale(calc(1+var(--voice-input-level)*0.55))] before:transition-[transform,opacity] before:duration-fast before:ease-standard before:content-[""] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-full after:border after:border-color/30 after:[opacity:calc(var(--voice-input-level)*0.45)] after:[transform:scale(calc(1+var(--voice-input-level)*1.05))] after:transition-[transform,opacity] after:duration-normal after:ease-standard after:content-[""] motion-reduce:before:transition-none motion-reduce:after:transition-none'
		},
		{ variant: 'compact', expanded: false, size: 'small', class: '!size-8' },
		{ variant: 'compact', expanded: false, size: 'normal', class: '!size-9' },
		{ variant: 'compact', expanded: false, size: 'large', class: '!size-10' }
	],
	defaultVariants: {
		size: 'normal',
		variant: 'default'
	}
});

const defaultWaveformContainer = cva({
	base: 'relative min-w-0 flex-1 rounded-sm outline-none',
	variants: {
		size: {
			small: null,
			normal: null,
			large: null
		},
		interactive: {
			true: 'cursor-pointer has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-focus/50',
			false: null
		},
		hidden: {
			true: 'hidden',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		interactive: false,
		hidden: false
	}
});

const defaultWaveform = cva({
	base: 'block w-full min-w-0 text-neutral/70 transition-colors',
	variants: {
		size: {
			small: 'h-6',
			normal: 'h-8',
			large: 'h-9'
		},
		recording: {
			true: 'text-color-readable',
			false: null
		},
		hidden: {
			true: 'hidden',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		recording: false,
		hidden: false
	}
});

const defaultWaveformInput = cva({
	base: 'absolute inset-0 z-10 m-0 h-full w-full cursor-pointer touch-none appearance-none bg-transparent opacity-0 focus:outline-none disabled:cursor-not-allowed'
});

const defaultTimer = cva({
	base: 'shrink-0 text-right font-medium tabular-nums text-neutral/70',
	variants: {
		size: {
			small: 'min-w-8 text-xs',
			normal: 'min-w-9 text-sm',
			large: 'min-w-10 text-base'
		},
		playback: {
			true: 'min-w-fit',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		playback: false
	}
});

const defaultError = cva({
	base: 'min-w-0 flex-1 truncate text-danger-readable',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const voiceInputTheme = {
	root: defaultRoot,
	inputContainer: defaultInputContainer,
	content: defaultContent,
	action: defaultAction,
	playbackAction: defaultPlaybackAction,
	clearAction: defaultClearAction,
	waveformContainer: defaultWaveformContainer,
	waveform: defaultWaveform,
	waveformInput: defaultWaveformInput,
	timer: defaultTimer,
	error: defaultError
};

export type VoiceInputTheme = typeof voiceInputTheme;
export type VoiceInputThemeProps = InferComponentTheme<VoiceInputTheme>;
export const setVoiceInputTheme = setComponentTheme<VoiceInputTheme>('voice-input');
export const useVoiceInputTheme = useComponentTheme<VoiceInputTheme>(
	'voice-input',
	voiceInputTheme
);
