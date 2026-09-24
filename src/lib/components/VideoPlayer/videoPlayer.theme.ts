import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The player lays itself out against its own width, not the viewport: the root is a container and
// every breakpoint below is a container query, so a narrow player on a wide screen still gets the
// compact controls.
//
// Old viewport breakpoint -> container width, derived from what actually fits rather than from the
// pixel value of the old media query:
//   `md:` (768px viewport) -> `@md:` (28rem / 448px of PLAYER width). This is the compact/full
//     switch. Measured at `size="normal"`, the full control row's content is ~350px (timecode 58 +
//     transport cluster 108 + secondary controls 184) plus two `gap-xs` and the bar's `p-md`
//     padding, i.e. ~400px; 28rem leaves headroom for an `HH:MM:SS / HH:MM:SS` timecode and the
//     volume slider expanding on hover. The old 48rem/768px threshold was a px-for-px copy of the
//     viewport query and left a video in an ordinary ~700px content column on phone-sized chrome.
//   `lg:` (1024px viewport) -> `@xl:` (36rem / 576px of player width). Nothing reflows here: it is
//     purely the roomy step (bar padding `p-md`->`p-lg`, row gaps `xs`->`sm`, control buttons
//     `size-7`->`size-8`). 36rem is where the row still fits comfortably once it is spent.
const defaultVideoPlayerRoot = cva({
	base: 'group/video-player @container relative isolate w-full min-w-0 overflow-hidden rounded-xl border border-neutral-muted bg-black text-white outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		},
		fullscreen: {
			fullscreen: 'h-full w-full rounded-none border-0',
			windowed: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false,
		fullscreen: 'windowed'
	}
});

const defaultVideoPlayerAspectRatio = cva({
	base: 'w-full bg-black',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerFrame = cva({
	base: 'relative min-h-40 w-full bg-black',
	variants: {
		ratio: {
			auto: '',
			fixed: 'absolute inset-0 min-h-0',
			fullscreen: 'h-full min-h-0'
		}
	},
	defaultVariants: {
		ratio: 'auto'
	}
});

const defaultVideoPlayerMedia = cva({
	base: 'block h-full w-full bg-black object-contain',
	variants: {
		disabled: {
			true: 'pointer-events-none',
			false: ''
		}
	},
	defaultVariants: {
		disabled: false
	}
});

const defaultVideoPlayerOverlay = cva({
	base: 'pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-xl',
	variants: {
		visible: {
			true: '',
			false: 'hidden'
		}
	},
	defaultVariants: {
		visible: true
	}
});

const defaultVideoPlayerPanel = cva({
	base: 'rounded-lg border border-white/15 bg-black/70 px-lg py-md text-center text-white lift-4 backdrop-blur',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		tone: {
			loading: '',
			error: 'border-danger/60 text-danger-lighter',
			empty: 'text-white/70'
		}
	},
	defaultVariants: {
		size: 'normal',
		tone: 'loading'
	}
});

const defaultVideoPlayerControls = cva({
	base: 'absolute inset-0 z-20 text-white transition-opacity duration-normal',
	variants: {
		visible: {
			true: 'opacity-100',
			false: 'pointer-events-none opacity-0'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		visible: true,
		size: 'normal'
	}
});

const defaultVideoPlayerControlsBackdrop = cva({
	base: 'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-black/85 via-black/45 to-transparent @md:h-32'
});

const defaultVideoPlayerControlsBar = cva({
	base: 'absolute inset-x-0 bottom-0 z-20 grid gap-md @max-md:flex @max-md:items-center @max-md:gap-sm',
	variants: {
		size: {
			small: 'gap-sm p-xs @md:p-md',
			normal: 'gap-md p-xs @md:p-md @xl:p-lg',
			large: 'gap-md p-md @md:p-lg @xl:p-xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerControlRow = cva({
	base: 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-md @max-md:contents @md:flex @md:flex-nowrap',
	variants: {
		size: {
			small: 'gap-xs @md:gap-xs',
			normal: 'gap-sm @md:gap-xs @xl:gap-sm',
			large: 'gap-md @md:gap-sm @xl:gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerControlStart = cva({
	base: 'order-1 flex min-w-0 items-center justify-start @max-md:hidden @md:order-2',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerControlCenter = cva({
	base: 'order-2 flex shrink-0 items-center justify-center gap-xs @max-md:hidden @md:order-1 @md:justify-start',
	variants: {
		size: {
			small: 'gap-micro @md:gap-xs',
			normal: 'gap-xs @md:gap-xs @xl:gap-sm',
			large: 'gap-sm @md:gap-sm @xl:gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerControlEnd = cva({
	base: 'order-3 flex min-w-0 items-center justify-end gap-micro @max-md:min-w-fit @max-md:flex-none @md:ml-auto',
	variants: {
		size: {
			small: 'gap-micro @md:gap-xs',
			normal: 'gap-micro @md:gap-xs @xl:gap-sm',
			large: 'gap-xs @md:gap-sm @xl:gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Compact layout (player narrower than `@md`): the transport floats over the frame, the settings
// button joins the timeline row, and the full control row is hidden.
const defaultVideoPlayerCompactTransport = cva({
	base: 'absolute top-1/2 left-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-sm @max-md:flex'
});

const defaultVideoPlayerCompactSettings = cva({
	base: 'hidden @max-md:flex'
});

const defaultVideoPlayerSecondaryControls = cva({
	base: 'contents @max-md:hidden'
});

const defaultVideoPlayerControlButton = cva({
	base: '!border-white/10 !text-white hover:!bg-white/15 active:!bg-white/20 data-[active=true]:!bg-white/20',
	variants: {
		size: {
			small: '!size-6 !min-w-6 @md:!size-7 @md:!min-w-7',
			normal: '!size-6 !min-w-6 @md:!size-7 @md:!min-w-7 @xl:!size-8 @xl:!min-w-8',
			large: '!size-7 !min-w-7 @md:!size-8 @md:!min-w-8 @xl:!size-9 @xl:!min-w-9'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerSlider = cva({
	base: 'relative flex w-full min-w-0 flex-1 items-center gap-md py-sm',
	variants: {
		size: {
			small: 'py-xs',
			normal: 'py-sm',
			large: 'py-md'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultVideoPlayerTimelineTrack = cva({
	base: 'group relative h-11 w-full min-w-0 touch-none rounded-full outline-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-white/60 has-[input:focus-visible]:ring-offset-0',
	variants: {
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		disabled: false
	}
});

const defaultVideoPlayerTimelineRail = cva({
	base: 'absolute inset-x-0 bottom-0 h-1.5 overflow-hidden rounded-full bg-white/25 @max-md:top-1/2 @max-md:bottom-auto @max-md:-translate-y-1/2'
});

const defaultVideoPlayerTimelineBuffered = cva({
	base: 'absolute inset-y-0 left-0 rounded-full bg-white/35'
});

const defaultVideoPlayerTimelineRange = cva({
	base: 'absolute inset-y-0 left-0 rounded-full bg-primary'
});

const defaultVideoPlayerTimelineThumb = cva({
	base: 'pointer-events-none absolute bottom-[-3px] z-10 size-3 -translate-x-1/2 rounded-full bg-white shadow transition-transform group-focus-within:scale-110 @max-md:top-1/2 @max-md:bottom-auto @max-md:-translate-y-1/2'
});

const defaultVideoPlayerTimelineInput = cva({
	base: 'absolute inset-x-0 top-1/2 z-20 m-0 h-11 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent opacity-0 focus:outline-none disabled:cursor-not-allowed'
});

const defaultVideoPlayerTime = cva({
	base: 'min-w-fit tabular-nums text-white',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultVideoPlayerMenu = cva({
	base: 'grid gap-xs'
});

const defaultVideoPlayerPopoverPanel = cva({
	base: 'border-white/10 bg-black/90 text-white lift-5 backdrop-blur'
});

const defaultVideoPlayerVolumePanel = cva({
	base: 'flex w-full min-w-0 items-center gap-md p-xs'
});

export const videoPlayerTheme = {
	root: defaultVideoPlayerRoot,
	aspectRatio: defaultVideoPlayerAspectRatio,
	frame: defaultVideoPlayerFrame,
	media: defaultVideoPlayerMedia,
	overlay: defaultVideoPlayerOverlay,
	panel: defaultVideoPlayerPanel,
	controls: defaultVideoPlayerControls,
	controlsBackdrop: defaultVideoPlayerControlsBackdrop,
	controlsBar: defaultVideoPlayerControlsBar,
	controlRow: defaultVideoPlayerControlRow,
	controlStart: defaultVideoPlayerControlStart,
	controlCenter: defaultVideoPlayerControlCenter,
	controlEnd: defaultVideoPlayerControlEnd,
	controlButton: defaultVideoPlayerControlButton,
	compactTransport: defaultVideoPlayerCompactTransport,
	compactSettings: defaultVideoPlayerCompactSettings,
	secondaryControls: defaultVideoPlayerSecondaryControls,
	slider: defaultVideoPlayerSlider,
	timelineTrack: defaultVideoPlayerTimelineTrack,
	timelineRail: defaultVideoPlayerTimelineRail,
	timelineBuffered: defaultVideoPlayerTimelineBuffered,
	timelineRange: defaultVideoPlayerTimelineRange,
	timelineThumb: defaultVideoPlayerTimelineThumb,
	timelineInput: defaultVideoPlayerTimelineInput,
	time: defaultVideoPlayerTime,
	menu: defaultVideoPlayerMenu,
	popoverPanel: defaultVideoPlayerPopoverPanel,
	volumePanel: defaultVideoPlayerVolumePanel
};

export type VideoPlayerTheme = typeof videoPlayerTheme;
export type VideoPlayerThemeProps = InferComponentTheme<VideoPlayerTheme>;
export const setVideoPlayerTheme = setComponentTheme<VideoPlayerTheme>('video-player');
export const useVideoPlayerTheme = useComponentTheme('video-player', videoPlayerTheme);
