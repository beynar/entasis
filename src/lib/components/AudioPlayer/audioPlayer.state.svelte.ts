import { bind } from '$lib/utils/state.svelte.js';
import { mediaVolume } from '../MediaVolume/index.js';
import type {
	AudioPlayerError,
	AudioPlayerErrorPayload,
	AudioPlayerSnapshot,
	AudioPlayerStateMode
} from './audioPlayer.props.js';

type AudioPlayerStateOptions = {
	currentTime: number;
	duration: number;
	buffered: number;
	volume: number;
	muted: boolean;
	paused: boolean;
	ended: boolean;
	loop: boolean;
	error: AudioPlayerError | null;
	disabled: boolean;
	seekStep: number;
	volumeStep: number;
	callbacks: AudioPlayerCallbacks;
};

type AudioPlayerCallbacks = {
	onPlay?: (snapshot: AudioPlayerSnapshot) => void;
	onPause?: (snapshot: AudioPlayerSnapshot) => void;
	onEnded?: (snapshot: AudioPlayerSnapshot) => void;
	onTimeUpdate?: (snapshot: AudioPlayerSnapshot) => void;
	onDurationChange?: (snapshot: AudioPlayerSnapshot) => void;
	onVolumeChange?: (snapshot: AudioPlayerSnapshot) => void;
	onLoopChange?: (snapshot: AudioPlayerSnapshot) => void;
	onError?: (payload: AudioPlayerErrorPayload) => void;
};

export interface AudioPlayerState extends AudioPlayerStateOptions {}

const MEDIA_ERROR_MESSAGES: Record<number, string> = {
	1: 'Audio loading was aborted.',
	2: 'A network error interrupted audio loading.',
	3: 'The audio could not be decoded.',
	4: 'The audio source is unsupported.'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isFiniteNumber = (value: number) => Number.isFinite(value);

export class AudioPlayerState {
	rootElement = $state<HTMLDivElement | null>(null);
	mediaElement = $state<HTMLAudioElement | null>(null);
	isLoading = $state(false);
	hasLoadedMetadata = $state(false);
	currentSrc = $state('');
	state: AudioPlayerStateMode = $derived.by(() => {
		if (this.error) return 'error';
		if (this.isLoading) return 'loading';
		if (this.hasLoadedMetadata) return 'ready';
		return 'idle';
	});

	constructor(options: AudioPlayerStateOptions) {
		bind(this, options);
	}

	get snapshot(): AudioPlayerSnapshot {
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
		return MEDIA_ERROR_MESSAGES[this.error.code] ?? 'Audio playback failed.';
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
		const mediaError = this.mediaElement?.error ?? new Error('Audio playback failed.');
		this.setError(mediaError);
		this.isLoading = false;
	};

	handleKeydown = (event: KeyboardEvent) => {
		if (this.disabled || this.shouldIgnoreKeydown(event)) return;
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
		if (key === 'l') {
			event.preventDefault();
			this.setLoop(!this.loop);
		}
	};

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

	private requireMediaElement() {
		if (!this.mediaElement) throw new Error('Audio element is not mounted.');
		return this.mediaElement;
	}

	private requireEnabled() {
		if (this.disabled) throw new Error('Audio player is disabled.');
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

	private shouldIgnoreKeydown(event: KeyboardEvent) {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return false;
		return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));
	}

	private setInteractionError(error: unknown) {
		this.setError(error instanceof Error ? error : new Error('Audio interaction failed.'));
	}

	private setError(error: AudioPlayerError) {
		this.error = error;
		this.callbacks.onError?.({ error, snapshot: this.snapshot });
	}
}
