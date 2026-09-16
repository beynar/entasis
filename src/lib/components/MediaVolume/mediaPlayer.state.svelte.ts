/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging -- Descriptor binding follows the established Svelai state-class pattern. */
import { bind } from '$lib/utils/state.svelte.js';
import { mediaVolume } from './mediaVolume.js';

export type MediaPlayerStateMode = 'idle' | 'loading' | 'ready' | 'error';
export type MediaPlayerError = MediaError | Error;

export type MediaPlayerSnapshot = {
	currentTime: number;
	duration: number;
	buffered: number;
	volume: number;
	muted: boolean;
	paused: boolean;
	ended: boolean;
	loop: boolean;
};

export type MediaPlayerCallbacks<TSnapshot extends MediaPlayerSnapshot> = {
	onPlay?: (payload: TSnapshot) => void;
	onPause?: (payload: TSnapshot) => void;
	onEnded?: (payload: TSnapshot) => void;
	onTimeUpdate?: (payload: TSnapshot) => void;
	onDurationChange?: (payload: TSnapshot) => void;
	onVolumeChange?: (payload: TSnapshot) => void;
	onLoopChange?: (payload: TSnapshot) => void;
	onError?: (payload: { error: MediaPlayerError; snapshot: TSnapshot }) => void;
};

export type MediaPlayerStateOptions<
	TSnapshot extends MediaPlayerSnapshot,
	TCallbacks extends MediaPlayerCallbacks<TSnapshot>
> = {
	currentTime: number;
	duration: number;
	buffered: number;
	volume: number;
	muted: boolean;
	paused: boolean;
	ended: boolean;
	loop: boolean;
	error: MediaPlayerError | null;
	disabled: boolean;
	seekStep: number;
	volumeStep: number;
	callbacks: TCallbacks;
};

/**
 * Wording each player supplies so its user-facing copy keeps its own media noun:
 * `media` reads as "The audio could not be decoded." / "The media could not be decoded.",
 * `player` as "Audio element is not mounted." / "Video player is disabled.".
 */
export type MediaPlayerNouns = {
	media: string;
	player: string;
};

/**
 * One keyboard rule for every media player: a shortcut is dropped when the key was typed
 * inside a control that owns its own keyboard handling.
 */
const INTERACTIVE_KEYBOARD_OWNERS =
	'input, textarea, select, button, a[href], [contenteditable]:not([contenteditable="false"])';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isFiniteNumber = (value: number) => Number.isFinite(value);
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const shouldIgnoreMediaKeydown = (event: KeyboardEvent) => {
	const target = event.target;
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest(INTERACTIVE_KEYBOARD_OWNERS));
};

export interface MediaPlayerState<
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mirrors the class type parameters so the two declarations merge.
	TElement extends HTMLMediaElement,
	TSnapshot extends MediaPlayerSnapshot,
	TCallbacks extends MediaPlayerCallbacks<TSnapshot>
> extends MediaPlayerStateOptions<TSnapshot, TCallbacks> {}

/**
 * Playback, seeking, volume, error reporting and keyboard shortcuts shared by the audio and
 * video players. Subclasses add their own element-specific behaviour (captions, fullscreen,
 * picture-in-picture, playback rate) and supply the nouns used in user-facing copy.
 */
export abstract class MediaPlayerState<
	TElement extends HTMLMediaElement,
	TSnapshot extends MediaPlayerSnapshot,
	TCallbacks extends MediaPlayerCallbacks<TSnapshot>
> {
	rootElement = $state<HTMLDivElement | null>(null);
	mediaElement = $state<TElement | null>(null);
	isLoading = $state(false);
	hasLoadedMetadata = $state(false);
	currentSrc = $state('');
	state: MediaPlayerStateMode = $derived.by(() => {
		if (this.error) return 'error';
		if (this.isLoading) return 'loading';
		if (this.hasLoadedMetadata) return 'ready';
		return 'idle';
	});

	constructor(options: MediaPlayerStateOptions<TSnapshot, TCallbacks>) {
		bind(this, options);
	}

	/** Media noun used in error copy, and player noun used in mount/disabled errors. */
	protected abstract readonly nouns: MediaPlayerNouns;

	abstract get snapshot(): TSnapshot;

	/** The half of the snapshot every media player reports. */
	protected get mediaSnapshot(): MediaPlayerSnapshot {
		return {
			currentTime: this.currentTime,
			duration: this.duration,
			buffered: this.buffered,
			volume: this.volume,
			muted: this.muted,
			paused: this.paused,
			ended: this.ended,
			loop: this.loop
		};
	}

	get errorMessage() {
		if (!this.error) return '';
		if (this.error instanceof Error) return this.error.message;
		return this.getMediaErrorMessage(this.error.code);
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
		if (this.hasLoadedMetadata && isFiniteNumber(this.currentTime)) {
			const nextTime = this.getClampedTime(this.currentTime);
			if (Math.abs(mediaElement.currentTime - nextTime) > 0.35) mediaElement.currentTime = nextTime;
		}
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
		this.loop = mediaElement.loop;
		this.currentSrc = mediaElement.currentSrc;
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

	handleError = () => {
		const mediaError = this.mediaElement?.error ?? new Error(this.playbackFailedMessage);
		this.setError(mediaError);
		this.isLoading = false;
	};

	handleKeydown = (event: KeyboardEvent) => {
		if (this.disabled || shouldIgnoreMediaKeydown(event)) return;
		const key = event.key.toLowerCase();

		if (event.key === ' ' || key === 'k') {
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
		if (key === 'm') {
			event.preventDefault();
			this.toggleMuted();
			return;
		}
		this.handlePlayerKeydown(key, event);
	};

	/** Shortcuts owned by one player: looping for audio, fullscreen/PiP/captions for video. */
	protected abstract handlePlayerKeydown(key: string, event: KeyboardEvent): void;

	async play() {
		this.requireEnabled();
		await this.requireMediaElement().play();
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

	setLoop(loop: boolean) {
		this.requireEnabled();
		this.requireMediaElement().loop = loop;
		this.loop = loop;
		this.callbacks.onLoopChange?.(this.snapshot);
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

	protected get playbackFailedMessage() {
		return `${capitalize(this.nouns.media)} playback failed.`;
	}

	/** Message reported when an interaction (play, fullscreen, …) rejects with a non-error. */
	protected get interactionFailedMessage() {
		return `${this.nouns.player} interaction failed.`;
	}

	protected requireMediaElement() {
		if (!this.mediaElement) throw new Error(`${this.nouns.player} element is not mounted.`);
		return this.mediaElement;
	}

	protected requireEnabled() {
		if (this.disabled) throw new Error(`${this.nouns.player} player is disabled.`);
	}

	protected getClampedTime(time: number) {
		if (!this.duration) return Math.max(0, time);
		return clamp(time, 0, this.duration);
	}

	protected setError(error: MediaPlayerError) {
		this.error = error;
		this.callbacks.onError?.({ error, snapshot: this.snapshot });
	}

	private getMediaErrorMessage(code: number) {
		const media = this.nouns.media;
		switch (code) {
			case 1:
				return `${capitalize(media)} loading was aborted.`;
			case 2:
				return `A network error interrupted ${media} loading.`;
			case 3:
				return `The ${media} could not be decoded.`;
			case 4:
				return `The ${media} source is unsupported.`;
			default:
				return this.playbackFailedMessage;
		}
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

	private setInteractionError(error: unknown) {
		this.setError(error instanceof Error ? error : new Error(this.interactionFailedMessage));
	}
}
