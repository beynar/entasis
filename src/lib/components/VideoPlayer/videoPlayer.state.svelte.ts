/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging -- Descriptor binding follows the established Entasis state-class pattern. */
import {
	MediaPlayerState,
	type MediaPlayerCallbacks,
	type MediaPlayerNouns,
	type MediaPlayerStateOptions
} from '../MediaVolume/mediaPlayer.state.svelte.js';
import type { VideoPlayerErrorPayload, VideoPlayerSnapshot } from './videoPlayer.props.js';

type PictureInPictureDocument = Document & {
	pictureInPictureElement?: Element | null;
	exitPictureInPicture?: () => Promise<void>;
};

type PictureInPictureVideoElement = HTMLVideoElement & {
	requestPictureInPicture?: () => Promise<unknown>;
	disablePictureInPicture?: boolean;
};

type VideoPlayerCallbacks = MediaPlayerCallbacks<VideoPlayerSnapshot> & {
	onRateChange?: (payload: VideoPlayerSnapshot) => void;
	onFullscreenChange?: (payload: VideoPlayerSnapshot) => void;
	onPictureInPictureChange?: (payload: VideoPlayerSnapshot) => void;
	onCaptionsChange?: (payload: VideoPlayerSnapshot) => void;
	onError?: (payload: VideoPlayerErrorPayload) => void;
};

type VideoPlayerStateOptions = MediaPlayerStateOptions<
	VideoPlayerSnapshot,
	VideoPlayerCallbacks
> & {
	playbackRate: number;
	fullscreen: boolean;
	pictureInPicture: boolean;
	captionsEnabled: boolean;
	activeTextTrack: string | null;
};

const isFiniteNumber = (value: number) => Number.isFinite(value);

export interface VideoPlayerState extends VideoPlayerStateOptions {}

export class VideoPlayerState extends MediaPlayerState<
	HTMLVideoElement,
	VideoPlayerSnapshot,
	VideoPlayerCallbacks
> {
	actualFullscreen = $state(false);
	actualPictureInPicture = $state(false);
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

	protected readonly nouns: MediaPlayerNouns = { media: 'media', player: 'Video' };

	constructor(options: VideoPlayerStateOptions) {
		super(options);
	}

	get snapshot(): VideoPlayerSnapshot {
		return {
			...this.mediaSnapshot,
			playbackRate: this.playbackRate,
			fullscreen: this.actualFullscreen,
			pictureInPicture: this.actualPictureInPicture,
			captionsEnabled: this.captionsEnabled,
			activeTextTrack: this.activeTextTrack
		};
	}

	protected override get interactionFailedMessage() {
		return 'Video player interaction failed.';
	}

	override syncMediaProperties() {
		super.syncMediaProperties();
		const mediaElement = this.mediaElement;
		if (!mediaElement) return;
		if (this.playbackRate > 0 && mediaElement.playbackRate !== this.playbackRate) {
			mediaElement.playbackRate = this.playbackRate;
		}
		this.syncCaptions();
	}

	override refreshMediaState() {
		const mediaElement = this.mediaElement;
		if (!mediaElement) return;
		super.refreshMediaState();
		this.playbackRate = mediaElement.playbackRate;
		this.captionsEnabled = this.readCaptionsEnabled();
		this.activeTextTrack = this.readActiveTextTrack();
	}

	handleRateChange = () => {
		this.refreshMediaState();
		this.callbacks.onRateChange?.(this.snapshot);
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

	protected override handlePlayerKeydown(key: string, event: KeyboardEvent) {
		if (key === 'f') {
			event.preventDefault();
			this.runInteraction(() => this.toggleFullscreen());
			return;
		}
		if (key === 'p') {
			event.preventDefault();
			this.runInteraction(() => this.togglePictureInPicture());
			return;
		}
		if (key === 'c') {
			event.preventDefault();
			this.setCaptionsEnabled(!this.captionsEnabled);
		}
	}

	setPlaybackRate(playbackRate: number) {
		this.requireEnabled();
		if (!isFiniteNumber(playbackRate) || playbackRate <= 0) {
			throw new RangeError('Playback rate must be a positive finite number.');
		}
		this.requireMediaElement().playbackRate = playbackRate;
		this.playbackRate = playbackRate;
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

	override resetForSourceChange() {
		super.resetForSourceChange();
		this.captionsEnabled = false;
		this.activeTextTrack = null;
	}

	private requireRootElement() {
		if (!this.rootElement) throw new Error('Video player root is not mounted.');
		return this.rootElement;
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
}
