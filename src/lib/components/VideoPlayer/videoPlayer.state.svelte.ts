import { bind } from '$lib/utils/state.svelte.js';
import { mediaVolume } from '../MediaVolume/index.js';
import type {
	VideoPlayerError,
	VideoPlayerErrorPayload,
	VideoPlayerSnapshot,
	VideoPlayerStateMode
} from './videoPlayer.props.js';

type PictureInPictureDocument = Document & {
	pictureInPictureElement?: Element | null;
	exitPictureInPicture?: () => Promise<void>;
};

type PictureInPictureVideoElement = HTMLVideoElement & {
	requestPictureInPicture?: () => Promise<unknown>;
	disablePictureInPicture?: boolean;
};

type VideoPlayerStateOptions = {
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
	error: VideoPlayerError | null;
	disabled: boolean;
	seekStep: number;
	volumeStep: number;
	callbacks: VideoPlayerCallbacks;
};

type VideoPlayerCallbacks = {
	onPlay?: (snapshot: VideoPlayerSnapshot) => void;
	onPause?: (snapshot: VideoPlayerSnapshot) => void;
	onEnded?: (snapshot: VideoPlayerSnapshot) => void;
	onTimeUpdate?: (snapshot: VideoPlayerSnapshot) => void;
	onDurationChange?: (snapshot: VideoPlayerSnapshot) => void;
	onVolumeChange?: (snapshot: VideoPlayerSnapshot) => void;
	onRateChange?: (snapshot: VideoPlayerSnapshot) => void;
	onLoopChange?: (snapshot: VideoPlayerSnapshot) => void;
	onFullscreenChange?: (snapshot: VideoPlayerSnapshot) => void;
	onPictureInPictureChange?: (snapshot: VideoPlayerSnapshot) => void;
	onCaptionsChange?: (snapshot: VideoPlayerSnapshot) => void;
	onError?: (payload: VideoPlayerErrorPayload) => void;
};

export interface VideoPlayerState extends VideoPlayerStateOptions {}

const MEDIA_ERROR_MESSAGES: Record<number, string> = {
	1: 'Media loading was aborted.',
	2: 'A network error interrupted media loading.',
	3: 'The media could not be decoded.',
	4: 'The media source is unsupported.'
};

const isFiniteNumber = (value: number) => Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class VideoPlayerState {
	rootElement = $state<HTMLDivElement | null>(null);
	mediaElement = $state<HTMLVideoElement | null>(null);
	isLoading = $state(false);
	hasLoadedMetadata = $state(false);
	actualFullscreen = $state(false);
	actualPictureInPicture = $state(false);
	currentSrc = $state('');
	supportsFullscreen = $derived.by(() => {
		if (typeof document === 'undefined') return false;
		return Boolean(this.rootElement?.requestFullscreen && document.exitFullscreen);
	});
	supportsPictureInPicture = $derived.by(() => {
		if (typeof document === 'undefined') return false;
		const mediaElement = this.mediaElement as PictureInPictureVideoElement | null;
		const pictureDocument = document as PictureInPictureDocument;
		return Boolean(mediaElement?.requestPictureInPicture && pictureDocument.exitPictureInPicture);
	});
	state: VideoPlayerStateMode = $derived.by(() => {
		if (this.error) return 'error';
		if (this.isLoading) return 'loading';
		if (this.hasLoadedMetadata) return 'ready';
		return 'idle';
	});

	constructor(options: VideoPlayerStateOptions) {
		bind(this, options);
	}

	get snapshot(): VideoPlayerSnapshot {
		return {
			currentTime: this.currentTime,
			duration: this.duration,
			buffered: this.buffered,
			volume: this.volume,
			muted: this.muted,
			paused: this.paused,
			ended: this.ended,
			playbackRate: this.playbackRate,
			loop: this.loop,
			fullscreen: this.actualFullscreen,
			pictureInPicture: this.actualPictureInPicture,
			captionsEnabled: this.captionsEnabled,
			activeTextTrack: this.activeTextTrack
		};
	}

	get errorMessage() {
		if (!this.error) return '';
		if (this.error instanceof Error) return this.error.message;
		return MEDIA_ERROR_MESSAGES[this.error.code] ?? 'Media playback failed.';
	}

	syncMediaProperties() {
		const mediaElement = this.mediaElement;
		if (!mediaElement) return;
		if (!this.hasLoadedMetadata && mediaElement.readyState >= 1) {
			this.hasLoadedMetadata = true;
			this.isLoading = false;
			this.error = null;
			this.refreshMediaState();
			this.callbacks.onDurationChange?.(this.snapshot);
		}

		mediaVolume.sync(mediaElement, { volume: this.volume, muted: this.muted });
		if (mediaElement.loop !== this.loop) mediaElement.loop = this.loop;
		if (this.playbackRate > 0 && mediaElement.playbackRate !== this.playbackRate) {
			mediaElement.playbackRate = this.playbackRate;
		}
		if (this.hasLoadedMetadata && isFiniteNumber(this.currentTime)) {
			const nextTime = this.getClampedTime(this.currentTime);
			if (Math.abs(mediaElement.currentTime - nextTime) > 0.35) mediaElement.currentTime = nextTime;
		}
		this.syncCaptions();
	}

	refreshMediaState() {
		const mediaElement = this.mediaElement;
		if (!mediaElement) return;

		this.currentTime = mediaElement.currentTime || 0;
		this.duration = isFiniteNumber(mediaElement.duration) ? mediaElement.duration : 0;
		this.buffered = this.getBufferedEnd(mediaElement);
		this.volume = mediaElement.volume;
		this.muted = mediaElement.muted;
		mediaVolume.rememberAudibleVolume(mediaElement);
		this.paused = mediaElement.paused;
		this.ended = mediaElement.ended;
		this.playbackRate = mediaElement.playbackRate;
		this.loop = mediaElement.loop;
		this.currentSrc = mediaElement.currentSrc;
		this.captionsEnabled = this.readCaptionsEnabled();
		this.activeTextTrack = this.readActiveTextTrack();
	}

	handleLoadedMetadata = () => {
		const requestedTime = this.currentTime;
		const mediaElement = this.requireMediaElement();
		this.hasLoadedMetadata = true;
		this.duration = isFiniteNumber(mediaElement.duration) ? mediaElement.duration : 0;
		if (isFiniteNumber(requestedTime) && requestedTime > 0) {
			mediaElement.currentTime = this.getClampedTime(requestedTime);
		}
		this.isLoading = false;
		this.error = null;
		this.refreshMediaState();
		this.callbacks.onDurationChange?.(this.snapshot);
	};

	handleLoadStart = () => {
		const requestedTime = this.currentTime;
		this.isLoading = true;
		this.hasLoadedMetadata = false;
		this.duration = 0;
		this.buffered = 0;
		this.currentTime = requestedTime;
		this.ended = false;
		this.paused = true;
		this.error = null;
	};

	handleCanPlay = () => {
		this.isLoading = false;
		this.refreshMediaState();
	};

	handleWaiting = () => {
		this.isLoading = true;
	};

	handlePlaying = () => {
		this.isLoading = false;
		this.refreshMediaState();
	};

	handlePlay = () => {
		this.refreshMediaState();
		this.callbacks.onPlay?.(this.snapshot);
	};

	handlePause = () => {
		this.refreshMediaState();
		this.callbacks.onPause?.(this.snapshot);
	};

	handleEnded = () => {
		this.refreshMediaState();
		this.callbacks.onEnded?.(this.snapshot);
	};

	handleTimeUpdate = () => {
		this.refreshMediaState();
		this.callbacks.onTimeUpdate?.(this.snapshot);
	};

	handleProgress = () => {
		this.refreshMediaState();
	};

	handleDurationChange = () => {
		this.refreshMediaState();
		this.callbacks.onDurationChange?.(this.snapshot);
	};

	handleVolumeChange = () => {
		this.refreshMediaState();
		this.callbacks.onVolumeChange?.(this.snapshot);
	};

	handleRateChange = () => {
		this.refreshMediaState();
		this.callbacks.onRateChange?.(this.snapshot);
	};

	handleError = () => {
		const mediaError = this.mediaElement?.error ?? new Error('Media playback failed.');
		this.setError(mediaError);
		this.isLoading = false;
	};

	handleFullscreenChange = () => {
		this.actualFullscreen = document.fullscreenElement === this.rootElement;
		this.fullscreen = this.actualFullscreen;
		this.callbacks.onFullscreenChange?.(this.snapshot);
	};

	handlePictureInPictureEnter = () => {
		this.actualPictureInPicture = true;
		this.pictureInPicture = true;
		this.callbacks.onPictureInPictureChange?.(this.snapshot);
	};

	handlePictureInPictureLeave = () => {
		this.actualPictureInPicture = false;
		this.pictureInPicture = false;
		this.callbacks.onPictureInPictureChange?.(this.snapshot);
	};

	handleKeydown = (event: KeyboardEvent) => {
		if (this.disabled || this.shouldIgnoreKeydown(event)) return;

		if (event.key === ' ' || event.key.toLowerCase() === 'k') {
			event.preventDefault();
			this.runInteraction(() => this.togglePlay());
			return;
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			this.seekBy(-this.seekStep);
			return;
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			this.seekBy(this.seekStep);
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			this.setVolume(this.volume + this.volumeStep);
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			this.setVolume(this.volume - this.volumeStep);
			return;
		}
		if (event.key.toLowerCase() === 'm') {
			event.preventDefault();
			this.toggleMuted();
			return;
		}
		if (event.key.toLowerCase() === 'f') {
			event.preventDefault();
			this.runInteraction(() => this.toggleFullscreen());
			return;
		}
		if (event.key.toLowerCase() === 'p') {
			event.preventDefault();
			this.runInteraction(() => this.togglePictureInPicture());
			return;
		}
		if (event.key.toLowerCase() === 'c') {
			event.preventDefault();
			this.setCaptionsEnabled(!this.captionsEnabled);
		}
	};

	async play() {
		this.requireEnabled();
		const mediaElement = this.requireMediaElement();
		await mediaElement.play();
	}

	pause() {
		this.requireEnabled();
		this.requireMediaElement().pause();
	}

	async togglePlay() {
		if (this.paused || this.ended) {
			await this.play();
			return;
		}
		this.pause();
	}

	load() {
		this.requireMediaElement().load();
	}

	seekTo(time: number) {
		this.requireEnabled();
		const mediaElement = this.requireMediaElement();
		mediaElement.currentTime = this.getClampedTime(time);
		this.refreshMediaState();
	}

	seekBy(delta: number) {
		this.seekTo(this.currentTime + delta);
	}

	setVolume(volume: number) {
		this.requireEnabled();
		mediaVolume.setVolume(this.requireMediaElement(), volume);
		this.refreshMediaState();
	}

	setMuted(muted: boolean) {
		this.requireEnabled();
		mediaVolume.setMuted(this.requireMediaElement(), muted, this.volumeStep);
		this.refreshMediaState();
	}

	toggleMuted() {
		this.requireEnabled();
		mediaVolume.toggleMuted(this.requireMediaElement(), {
			volume: this.volume,
			muted: this.muted,
			volumeStep: this.volumeStep
		});
		this.refreshMediaState();
	}

	setPlaybackRate(playbackRate: number) {
		this.requireEnabled();
		if (!isFiniteNumber(playbackRate) || playbackRate <= 0) {
			throw new RangeError('Playback rate must be a positive finite number.');
		}
		this.requireMediaElement().playbackRate = playbackRate;
		this.playbackRate = playbackRate;
	}

	setLoop(loop: boolean) {
		this.requireEnabled();
		this.requireMediaElement().loop = loop;
		this.loop = loop;
		this.callbacks.onLoopChange?.(this.snapshot);
	}

	setCaptionsEnabled(enabled: boolean) {
		this.requireEnabled();
		this.captionsEnabled = enabled;
		this.syncCaptions();
		this.callbacks.onCaptionsChange?.(this.snapshot);
	}

	setActiveTextTrack(activeTextTrack: string | null) {
		this.requireEnabled();
		this.activeTextTrack = activeTextTrack;
		this.captionsEnabled = activeTextTrack !== null;
		this.syncCaptions();
		this.callbacks.onCaptionsChange?.(this.snapshot);
	}

	async toggleFullscreen() {
		this.requireEnabled();
		if (document.fullscreenElement === this.rootElement) {
			await document.exitFullscreen();
			return;
		}
		const rootElement = this.requireRootElement();
		await rootElement.requestFullscreen();
	}

	async togglePictureInPicture() {
		this.requireEnabled();
		const pictureDocument = document as PictureInPictureDocument;
		const mediaElement = this.requireMediaElement() as PictureInPictureVideoElement;
		if (!mediaElement.requestPictureInPicture || !pictureDocument.exitPictureInPicture) {
			throw new Error('Picture-in-Picture is not supported in this browser.');
		}
		if (pictureDocument.pictureInPictureElement === mediaElement) {
			await pictureDocument.exitPictureInPicture();
			return;
		}
		await mediaElement.requestPictureInPicture();
	}

	resetForSourceChange() {
		this.hasLoadedMetadata = false;
		this.isLoading = true;
		this.currentTime = 0;
		this.duration = 0;
		this.buffered = 0;
		this.ended = false;
		this.paused = true;
		this.error = null;
		this.currentSrc = '';
		this.captionsEnabled = false;
		this.activeTextTrack = null;
	}

	runInteraction(action: () => void | Promise<void>) {
		try {
			Promise.resolve(action()).catch((error: unknown) => {
				this.setInteractionError(error);
			});
		} catch (error) {
			this.setInteractionError(error);
		}
	}

	private requireMediaElement() {
		if (!this.mediaElement) throw new Error('Video element is not mounted.');
		return this.mediaElement;
	}

	private requireRootElement() {
		if (!this.rootElement) throw new Error('Video player root is not mounted.');
		return this.rootElement;
	}

	private requireEnabled() {
		if (this.disabled) throw new Error('Video player is disabled.');
	}

	private getClampedTime(time: number) {
		if (!this.duration) return Math.max(0, time);
		return clamp(time, 0, this.duration);
	}

	private getBufferedEnd(mediaElement: HTMLMediaElement) {
		if (mediaElement.buffered.length === 0) return 0;
		for (let index = 0; index < mediaElement.buffered.length; index += 1) {
			const start = mediaElement.buffered.start(index);
			const end = mediaElement.buffered.end(index);
			if (mediaElement.currentTime >= start && mediaElement.currentTime <= end) return end;
		}
		return mediaElement.buffered.end(mediaElement.buffered.length - 1);
	}

	private syncCaptions() {
		const tracks = this.mediaElement?.textTracks;
		if (!tracks) {
			this.captionsEnabled = false;
			this.activeTextTrack = null;
			return;
		}
		const captionTracks = Array.from(tracks)
			.map((track, index) => ({ track, id: this.getTextTrackId(track, index) }))
			.filter(({ track }) => track.kind === 'captions' || track.kind === 'subtitles');

		if (captionTracks.length === 0 || !this.captionsEnabled) {
			for (const { track } of captionTracks) track.mode = 'disabled';
			this.captionsEnabled = false;
			this.activeTextTrack = null;
			return;
		}

		const selectedTrack =
			captionTracks.find(({ id }) => id === this.activeTextTrack) ?? captionTracks[0];
		for (const { track, id } of captionTracks) {
			track.mode = id === selectedTrack.id ? 'showing' : 'disabled';
		}
		this.captionsEnabled = true;
		this.activeTextTrack = selectedTrack.id;
	}

	private readCaptionsEnabled() {
		const tracks = this.mediaElement?.textTracks;
		if (!tracks) return false;
		return Array.from(tracks).some(
			(track) =>
				(track.kind === 'captions' || track.kind === 'subtitles') && track.mode === 'showing'
		);
	}

	private readActiveTextTrack() {
		const tracks = this.mediaElement?.textTracks;
		if (!tracks) return null;
		const activeTrack = Array.from(tracks).find(
			(track) =>
				(track.kind === 'captions' || track.kind === 'subtitles') && track.mode === 'showing'
		);
		if (!activeTrack) return null;
		return this.getTextTrackId(activeTrack, Array.from(tracks).indexOf(activeTrack));
	}

	private getTextTrackId(track: TextTrack, index: number) {
		const trackElement = this.mediaElement?.querySelectorAll('track')[index];
		return trackElement?.id || track.label || track.language || `${track.kind}:${index}`;
	}

	private setError(error: VideoPlayerError) {
		this.error = error;
		this.callbacks.onError?.({ error, snapshot: this.snapshot });
	}

	private setInteractionError(error: unknown) {
		this.setError(error instanceof Error ? error : new Error('Video player interaction failed.'));
	}

	private shouldIgnoreKeydown(event: KeyboardEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return false;
		return (
			['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable
		);
	}
}
