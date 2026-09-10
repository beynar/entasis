import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultAudioPlayerRoot = cva({
	base: 'group/audio-player relative grid w-full min-w-0 gap-lg overflow-hidden rounded-md border border-neutral-muted bg-surface p-lg text-neutral shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-color/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-60',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultAudioPlayerHeader = cva({
	base: 'flex min-w-0 flex-wrap items-center gap-lg',
	variants: {
		size: {
			small: 'gap-md',
			normal: 'gap-lg',
			large: 'gap-xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerArtwork = cva({
	base: 'relative grid shrink-0 place-items-center overflow-hidden rounded-sm border border-neutral-muted bg-neutral-muted text-neutral-muted-readable',
	variants: {
		size: {
			small: 'size-10',
			normal: 'size-12',
			large: 'size-14'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerArtworkImage = cva({
	base: 'h-full w-full object-cover'
});

const defaultAudioPlayerMeta = cva({
	base: 'min-w-0 flex-1'
});

const defaultAudioPlayerTitle = cva({
	base: 'truncate font-medium text-neutral',
	variants: {
		size: {
			small: 'text-sm',
			normal: 'text-base',
			large: 'text-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerArtist = cva({
	base: 'truncate text-neutral/60',
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

const defaultAudioPlayerControls = cva({
	base: 'min-w-0 gap-md',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		},
		layout: {
			block:
				'grid flex-[1_1_100%] md:flex md:flex-[0_1_auto] md:flex-wrap md:items-center md:justify-end md:gap-xs',
			inline: 'flex shrink-0 flex-wrap items-center'
		}
	},
	defaultVariants: {
		size: 'normal',
		layout: 'block'
	}
});

const defaultAudioPlayerControlGroup = cva({
	base: 'flex min-w-0 flex-wrap items-center gap-xs',
	variants: {
		layout: {
			block: 'w-full md:w-auto',
			inline: 'w-auto shrink-0'
		}
	},
	defaultVariants: {
		layout: 'block'
	}
});

const defaultAudioPlayerControlButton = cva({
	base: '!border-neutral-muted data-[active=true]:!bg-color/12 data-[active=true]:!text-color-readable',
	variants: {
		size: {
			small: '!size-7 !min-w-7',
			normal: '!size-8 !min-w-8',
			large: '!size-9 !min-w-9'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerPlayButton = cva({
	base: '',
	variants: {
		size: {
			small: '!size-8 !min-w-8',
			normal: '!size-9 !min-w-9',
			large: '!size-10 !min-w-10'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerWaveform = cva({
	base: 'relative h-24 min-w-0 overflow-hidden rounded-sm border border-neutral-muted bg-neutral-muted/45 p-lg outline-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-color/60',
	variants: {
		size: {
			small: 'h-20 p-md',
			normal: 'h-24 p-lg',
			large: 'h-28 p-xl'
		},
		variant: {
			centered: '',
			histogram: ''
		},
		disabled: {
			true: 'cursor-not-allowed opacity-60',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'centered',
		disabled: false
	}
});

const defaultAudioPlayerWaveformBars = cva({
	base: 'grid h-full min-w-0 gap-[3px]',
	variants: {
		variant: {
			centered: 'items-center',
			histogram: 'items-end'
		}
	},
	defaultVariants: {
		variant: 'centered'
	}
});

const defaultAudioPlayerWaveformBar = cva({
	base: 'relative min-h-2 min-w-0 overflow-hidden rounded-full bg-neutral/15',
	variants: {
		variant: {
			centered: '',
			histogram: ''
		}
	},
	defaultVariants: {
		variant: 'centered'
	}
});

const defaultAudioPlayerWaveformBarFill = cva({
	base: 'absolute inset-y-0 left-0 rounded-full bg-color'
});

const defaultAudioPlayerWaveformBarBuffered = cva({
	base: 'absolute inset-y-0 left-0 rounded-full bg-neutral/25'
});

const defaultAudioPlayerWaveformInput = cva({
	base: 'absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 focus:outline-none disabled:cursor-not-allowed'
});

const defaultAudioPlayerTrack = cva({
	base: 'relative min-w-0 rounded-full outline-none before:absolute before:inset-x-0 before:top-1/2 before:-translate-y-1/2 before:rounded-full before:bg-neutral/15 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-color/60',
	variants: {
		size: {
			small: 'h-8 before:h-1.5',
			normal: 'h-10 before:h-2',
			large: 'h-12 before:h-2.5'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-60',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultAudioPlayerTrackBuffered = cva({
	base: 'absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-neutral/25',
	variants: {
		size: {
			small: 'h-1.5',
			normal: 'h-2',
			large: 'h-2.5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerTrackRange = cva({
	base: 'absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-color',
	variants: {
		size: {
			small: 'h-1.5',
			normal: 'h-2',
			large: 'h-2.5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerTrackInput = cva({
	base: 'absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 focus:outline-none disabled:cursor-not-allowed'
});

const defaultAudioPlayerInline = cva({
	base: 'flex min-w-0 flex-col gap-md sm:flex-row sm:items-center',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerInlineSeek = cva({
	base: 'min-w-0 flex-1'
});

const defaultAudioPlayerInlineTrailing = cva({
	base: 'shrink-0'
});

const defaultAudioPlayerTime = cva({
	base: 'min-w-fit tabular-nums text-neutral/60',
	variants: {
		size: {
			small: 'text-[10px]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerVolumeControl = cva({
	base: 'flex shrink-0 items-center',
	variants: {
		layout: {
			block: '',
			inline: ''
		}
	},
	defaultVariants: {
		layout: 'block'
	}
});

const defaultAudioPlayerPopoverPanel = cva({
	base: ''
});

const defaultAudioPlayerVolumePanel = cva({
	base: 'flex min-w-0 flex-col items-center gap-md p-xs',
	variants: {
		size: {
			small: 'gap-md',
			normal: 'gap-lg',
			large: 'gap-xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerVolumeSlider = cva({
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'h-32',
			normal: 'h-36',
			large: 'h-40'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultAudioPlayerStatus = cva({
	base: 'rounded-sm border border-neutral-muted bg-surface px-md py-xs text-neutral/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		tone: {
			loading: '',
			error: 'border-danger/40 text-danger-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		tone: 'loading'
	}
});

export const audioPlayerTheme = {
	root: defaultAudioPlayerRoot,
	header: defaultAudioPlayerHeader,
	artwork: defaultAudioPlayerArtwork,
	artworkImage: defaultAudioPlayerArtworkImage,
	meta: defaultAudioPlayerMeta,
	title: defaultAudioPlayerTitle,
	artist: defaultAudioPlayerArtist,
	controls: defaultAudioPlayerControls,
	controlGroup: defaultAudioPlayerControlGroup,
	controlButton: defaultAudioPlayerControlButton,
	playButton: defaultAudioPlayerPlayButton,
	waveform: defaultAudioPlayerWaveform,
	waveformBars: defaultAudioPlayerWaveformBars,
	waveformBar: defaultAudioPlayerWaveformBar,
	waveformBarFill: defaultAudioPlayerWaveformBarFill,
	waveformBarBuffered: defaultAudioPlayerWaveformBarBuffered,
	waveformInput: defaultAudioPlayerWaveformInput,
	track: defaultAudioPlayerTrack,
	trackBuffered: defaultAudioPlayerTrackBuffered,
	trackRange: defaultAudioPlayerTrackRange,
	trackInput: defaultAudioPlayerTrackInput,
	inline: defaultAudioPlayerInline,
	inlineSeek: defaultAudioPlayerInlineSeek,
	inlineTrailing: defaultAudioPlayerInlineTrailing,
	time: defaultAudioPlayerTime,
	volumeControl: defaultAudioPlayerVolumeControl,
	popoverPanel: defaultAudioPlayerPopoverPanel,
	volumePanel: defaultAudioPlayerVolumePanel,
	volumeSlider: defaultAudioPlayerVolumeSlider,
	status: defaultAudioPlayerStatus
};

export type AudioPlayerTheme = typeof audioPlayerTheme;
export type AudioPlayerThemeProps = InferComponentTheme<AudioPlayerTheme>;
export const setAudioPlayerTheme = setComponentTheme<AudioPlayerTheme>('audioPlayer');
export const useAudioPlayerTheme = useComponentTheme('audioPlayer', audioPlayerTheme);
