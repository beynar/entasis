import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '$lib/types/theme.js';
import type { AspectRatioRatio } from '../AspectRatio/aspectRatio.props.js';
import type { VideoPlayerThemeProps } from './videoPlayer.theme.js';

export type VideoPlayerPreload = 'none' | 'metadata' | 'auto';
export type VideoPlayerCrossOrigin = 'anonymous' | 'use-credentials' | '';
export type VideoPlayerTrackKind =
	'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
export type VideoPlayerStateMode = 'idle' | 'loading' | 'ready' | 'error';
export type VideoPlayerFullscreenState = 'fullscreen' | 'windowed';
export type VideoPlayerControl =
	| 'play'
	| 'seekBackward'
	| 'seekForward'
	| 'seek'
	| 'time'
	| 'volume'
	| 'settings'
	| 'rate'
	| 'loop'
	| 'captions'
	| 'pictureInPicture'
	| 'download'
	| 'fullscreen';
export type VideoPlayerTimeVariant = 'elapsed' | 'remaining' | 'duration';

export const VIDEO_PLAYER_DEFAULT_CONTROLS: VideoPlayerControl[] = [
	'play',
	'seekBackward',
	'seekForward',
	'time',
	'seek',
	'volume',
	'settings',
	'pictureInPicture',
	'download',
	'fullscreen'
];

export const VIDEO_PLAYER_DEFAULT_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export type VideoPlayerSource = {
	src: string;
	type?: string;
	media?: string;
};

export type VideoPlayerTrack = {
	id?: string;
	src: string;
	kind?: VideoPlayerTrackKind;
	srclang?: string;
	label?: string;
	default?: boolean;
};

export type VideoPlayerSnapshot = {
	currentTime: number;
	duration: number;
	buffered: number;
	volume: number;
	muted: boolean;
	paused: boolean;
	ended: boolean;
	playbackRate: number;
	loop: boolean;
	fullscreen: boolean;
	pictureInPicture: boolean;
	captionsEnabled: boolean;
	activeTextTrack: string | null;
};

export type VideoPlayerError = MediaError | Error;

/** Error and player snapshot reported by `onError`. */
export type VideoPlayerErrorPayload = Readonly<{
	error: VideoPlayerError;
	snapshot: VideoPlayerSnapshot;
}>;

export type VideoPlayerOverlayPayload = {
	state: VideoPlayerStateMode;
	error: VideoPlayerError | null;
};

export type VideoPlayerProps = WithAttachments<{
	/** Single video source URL. Use sources for multiple encodings. */
	src?: string;
	/** MIME type for src when a single source is provided. */
	srcType?: string;
	/** Multiple source candidates rendered as source children. */
	sources?: VideoPlayerSource[];
	/** Text tracks rendered as track children. */
	tracks?: VideoPlayerTrack[];
	/** Poster image shown before playback. */
	poster?: string;
	/** Accessible title for the player region and native video. */
	title?: string;
	/** Accessible label applied as aria-label; falls back to title. */
	label?: string;
	/** Native video preload behavior. */
	preload?: VideoPlayerPreload;
	/** Native crossorigin value for remote media. */
	crossOrigin?: VideoPlayerCrossOrigin;
	/** Keeps playback inline on mobile browsers. */
	playsInline?: boolean;
	/** Starts playback automatically when allowed by the browser. */
	autoplay?: boolean;
	/** Renders browser-native controls instead of or alongside the custom Svelai controls. */
	nativeControls?: boolean;
	/** Custom Svelai controls to render. */
	controls?: VideoPlayerControl[];
	/** Playback rates exposed in settings/rate controls. */
	playbackRates?: number[];
	/** Enables automatic control hiding during playback. Defaults to true. */
	autoHideControls?: boolean;
	/** Delay before controls hide after pointer/keyboard activity. */
	hideControlsDelay?: number;
	/** Time display variant. */
	timeVariant?: VideoPlayerTimeVariant;
	/** Download href. true uses src, string uses the provided URL, false hides the action. */
	download?: boolean | string;
	/** Disables custom interactions and keyboard shortcuts. */
	disabled?: boolean;
	/** Visual size token for chrome and overlays. */
	size?: Sizes;
	/** Aspect ratio wrapper. Use auto to let the video define height. */
	ratio?: AspectRatioRatio | 'auto';
	/** Root classes. */
	class?: string;
	/** Bindable video element reference. */
	ref?: HTMLVideoElement | null;
	/** Bindable root element reference. */
	rootRef?: HTMLDivElement | null;
	/** Bindable current playback time in seconds. */
	currentTime?: number;
	/** Bindable media duration in seconds. */
	duration?: number;
	/** Bindable buffered end time in seconds. */
	buffered?: number;
	/** Bindable volume from 0 to 1. */
	volume?: number;
	/** Bindable muted state. */
	muted?: boolean;
	/** Bindable paused state. */
	paused?: boolean;
	/** Bindable ended state. */
	ended?: boolean;
	/** Bindable playback rate. */
	playbackRate?: number;
	/** Bindable loop state. */
	loop?: boolean;
	/** Bindable actual fullscreen state; assigning this prop does not request fullscreen. */
	fullscreen?: boolean;
	/** Bindable actual Picture-in-Picture state; assigning this prop does not request PiP. */
	pictureInPicture?: boolean;
	/** Bindable captions/subtitles state. */
	captionsEnabled?: boolean;
	/** Active captions/subtitles identity: track id, label, srclang/language, or kind:index. */
	activeTextTrack?: string | null;
	/** Bindable media or interaction error. */
	error?: VideoPlayerError | null;
	/** Enables player-level keyboard shortcuts. */
	keyboardShortcuts?: boolean;
	/** Seconds moved by seek forward/backward shortcuts and controls. */
	seekStep?: number;
	/** Volume delta used by keyboard shortcuts and controls. */
	volumeStep?: number;
	/** Custom content rendered inside the video element, after generated sources/tracks. */
	children?: Slot;
	/** Overlay rendered over the media. */
	overlay?: Slot<VideoPlayerOverlayPayload>;
	/** Loading overlay content. */
	loading?: Slot<VideoPlayerOverlayPayload>;
	/** Error overlay content. */
	errorContent?: Slot<VideoPlayerOverlayPayload>;
	/** Empty-source overlay content. */
	empty?: Slot<VideoPlayerOverlayPayload>;
	/** Called when the media starts playback. */
	onPlay?: (payload: VideoPlayerSnapshot) => void;
	/** Called when the media pauses. */
	onPause?: (payload: VideoPlayerSnapshot) => void;
	/** Called when playback ends. */
	onEnded?: (payload: VideoPlayerSnapshot) => void;
	/** Called when currentTime changes. */
	onTimeUpdate?: (payload: VideoPlayerSnapshot) => void;
	/** Called when duration changes. */
	onDurationChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when volume or muted state changes. */
	onVolumeChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when playbackRate changes. */
	onRateChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when loop changes through the component API. */
	onLoopChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when fullscreen state changes. */
	onFullscreenChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when Picture-in-Picture state changes. */
	onPictureInPictureChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when captions/subtitles are toggled. */
	onCaptionsChange?: (payload: VideoPlayerSnapshot) => void;
	/** Called when native media or custom interaction errors occur. */
	onError?: (payload: VideoPlayerErrorPayload) => void;
	/** Per-instance theme overrides. */
	theme?: VideoPlayerThemeProps;
}>;
