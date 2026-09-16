import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import VideoPlayerHarness from './VideoPlayerHarness.test.svelte';
import { VideoPlayerState } from './videoPlayer.state.svelte.js';

type FakeTextTrack = { kind: string; label: string; language: string; mode: string };

const createTextTrack = (overrides: Partial<FakeTextTrack> = {}): FakeTextTrack => ({
	kind: 'captions',
	label: 'English',
	language: 'en',
	mode: 'disabled',
	...overrides
});

class FakeMediaElement {
	currentTime = 0;
	duration = 120;
	volume = 1;
	muted = false;
	paused = true;
	ended = false;
	loop = false;
	playbackRate = 1;
	readyState = 1;
	currentSrc = 'https://example.test/clip.mp4';
	error: MediaError | null = null;
	textTracks: FakeTextTrack[] = [];
	buffered: { length: number; start: (index: number) => number; end: (index: number) => number } = {
		length: 1,
		start: () => 0,
		end: () => 30
	};
	play = vi.fn(async () => {
		this.paused = false;
	});
	pause = vi.fn(() => {
		this.paused = true;
	});
	load = vi.fn();
	requestPictureInPicture = vi.fn(async () => undefined);
	querySelectorAll = vi.fn(() => [] as unknown[]);
}

const createMediaElement = (overrides: Partial<FakeMediaElement> = {}) =>
	Object.assign(new FakeMediaElement(), overrides);

const createCallbacks = () => ({
	onPlay: vi.fn(),
	onPause: vi.fn(),
	onEnded: vi.fn(),
	onTimeUpdate: vi.fn(),
	onDurationChange: vi.fn(),
	onVolumeChange: vi.fn(),
	onRateChange: vi.fn(),
	onLoopChange: vi.fn(),
	onFullscreenChange: vi.fn(),
	onPictureInPictureChange: vi.fn(),
	onCaptionsChange: vi.fn(),
	onError: vi.fn()
});

const createPlayer = (
	options: {
		element?: Partial<FakeMediaElement> | null;
		disabled?: boolean;
		duration?: number;
		currentTime?: number;
		seekStep?: number;
		volumeStep?: number;
		captionsEnabled?: boolean;
		activeTextTrack?: string | null;
	} = {}
) => {
	const callbacks = createCallbacks();
	const player = new VideoPlayerState({
		currentTime: options.currentTime ?? 0,
		duration: options.duration ?? 120,
		buffered: 0,
		volume: 1,
		muted: false,
		paused: true,
		ended: false,
		playbackRate: 1,
		loop: false,
		fullscreen: false,
		pictureInPicture: false,
		captionsEnabled: options.captionsEnabled ?? false,
		activeTextTrack: options.activeTextTrack ?? null,
		error: null,
		disabled: options.disabled ?? false,
		seekStep: options.seekStep ?? 10,
		volumeStep: options.volumeStep ?? 0.05,
		callbacks
	});
	const element = options.element === null ? null : createMediaElement(options.element ?? {});
	player.mediaElement = element as unknown as HTMLVideoElement | null;
	return { player, element: element as FakeMediaElement, callbacks };
};

const dispatchKeydown = (player: VideoPlayerState, key: string, target?: HTMLElement) => {
	const host = target ?? document.createElement('div');
	if (!host.isConnected) document.body.append(host);
	host.addEventListener('keydown', player.handleKeydown);
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	host.dispatchEvent(event);
	host.removeEventListener('keydown', player.handleKeydown);
	return event;
};

const setDocumentProperty = (name: string, value: unknown) => {
	Object.defineProperty(document, name, { configurable: true, writable: true, value });
};

describe('VideoPlayerState playback', () => {
	test('load delegates to the media element', () => {
		const { player, element } = createPlayer();
		player.load();
		expect(element.load).toHaveBeenCalledTimes(1);
	});

	test('load throws when no media element is mounted', () => {
		const { player } = createPlayer({ element: null });
		expect(() => player.load()).toThrow('Video element is not mounted.');
	});

	test('play and pause delegate to the media element', async () => {
		const { player, element } = createPlayer();
		await player.play();
		expect(element.play).toHaveBeenCalledTimes(1);
		player.pause();
		expect(element.pause).toHaveBeenCalledTimes(1);
	});

	test('togglePlay plays when paused or ended and pauses otherwise', async () => {
		const { player, element } = createPlayer();
		player.paused = true;
		await player.togglePlay();
		expect(element.play).toHaveBeenCalledTimes(1);

		player.paused = false;
		player.ended = true;
		await player.togglePlay();
		expect(element.play).toHaveBeenCalledTimes(2);

		player.ended = false;
		player.paused = false;
		await player.togglePlay();
		expect(element.pause).toHaveBeenCalledTimes(1);
	});

	test('interactions throw when the player is disabled', async () => {
		const { player } = createPlayer({ disabled: true });
		await expect(player.play()).rejects.toThrow('Video player is disabled.');
		expect(() => player.seekTo(5)).toThrow('Video player is disabled.');
	});
});

describe('VideoPlayerState seeking', () => {
	test('seekTo clamps to the known duration', () => {
		const { player, element } = createPlayer();
		player.duration = 120;

		player.seekTo(60);
		expect(element.currentTime).toBe(60);

		player.seekTo(500);
		expect(element.currentTime).toBe(120);

		player.seekTo(-10);
		expect(element.currentTime).toBe(0);
	});

	test('seekTo clamps at zero when the duration is unknown', () => {
		const { player, element } = createPlayer();
		player.duration = 0;
		player.seekTo(-5);
		expect(element.currentTime).toBe(0);
		player.seekTo(42);
		expect(element.currentTime).toBe(42);
	});

	test('seekBy moves relative to the current time', () => {
		const { player, element } = createPlayer();
		player.duration = 120;
		player.currentTime = 30;
		player.seekBy(15);
		expect(element.currentTime).toBe(45);
		player.seekBy(-100);
		expect(element.currentTime).toBe(0);
	});
});

describe('VideoPlayerState volume', () => {
	test('setVolume clamps between 0 and 1', () => {
		const { player, element } = createPlayer();
		player.setVolume(0.4);
		expect(element.volume).toBe(0.4);
		expect(player.volume).toBe(0.4);

		player.setVolume(5);
		expect(element.volume).toBe(1);

		player.setVolume(-1);
		expect(element.volume).toBe(0);
	});

	test('setMuted restores an audible volume when unmuting from zero', () => {
		const { player, element } = createPlayer();
		player.setVolume(0.8);
		player.setVolume(0);
		player.setMuted(true);
		expect(element.muted).toBe(true);

		player.setMuted(false);
		expect(element.muted).toBe(false);
		expect(element.volume).toBe(0.8);
	});

	test('toggleMuted flips the effective muted state', () => {
		const { player, element } = createPlayer();
		player.toggleMuted();
		expect(element.muted).toBe(true);
		player.toggleMuted();
		expect(element.muted).toBe(false);
	});
});

describe('VideoPlayerState playback rate', () => {
	test('setPlaybackRate applies a positive rate', () => {
		const { player, element } = createPlayer();
		player.setPlaybackRate(1.5);
		expect(element.playbackRate).toBe(1.5);
		expect(player.playbackRate).toBe(1.5);
	});

	test('setPlaybackRate rejects non-positive and non-finite rates', () => {
		const { player } = createPlayer();
		expect(() => player.setPlaybackRate(0)).toThrow(RangeError);
		expect(() => player.setPlaybackRate(-1)).toThrow(RangeError);
		expect(() => player.setPlaybackRate(Number.POSITIVE_INFINITY)).toThrow(RangeError);
	});

	test('handleRateChange reports the element rate', () => {
		const { player, element, callbacks } = createPlayer();
		element.playbackRate = 2;
		player.handleRateChange();
		expect(player.playbackRate).toBe(2);
		expect(callbacks.onRateChange).toHaveBeenCalledTimes(1);
	});

	test('syncMediaProperties pushes the playback rate onto the element', () => {
		const { player, element } = createPlayer();
		player.hasLoadedMetadata = true;
		player.playbackRate = 0.5;
		player.syncMediaProperties();
		expect(element.playbackRate).toBe(0.5);
	});
});

describe('VideoPlayerState errors', () => {
	test('maps media error codes to media wording', () => {
		const { player } = createPlayer();
		const messages = [1, 2, 3, 4, 9].map((code) => {
			player.error = { code } as MediaError;
			return player.errorMessage;
		});
		expect(messages).toEqual([
			'Media loading was aborted.',
			'A network error interrupted media loading.',
			'The media could not be decoded.',
			'The media source is unsupported.',
			'Media playback failed.'
		]);
	});

	test('uses the message of a thrown Error', () => {
		const { player } = createPlayer();
		player.error = new Error('boom');
		expect(player.errorMessage).toBe('boom');
	});

	test('handleError reports the media error and leaves the loading state', () => {
		const { player, element, callbacks } = createPlayer();
		player.isLoading = true;
		element.error = { code: 3 } as MediaError;
		player.handleError();
		expect(player.errorMessage).toBe('The media could not be decoded.');
		expect(player.isLoading).toBe(false);
		expect(player.state).toBe('error');
		expect(callbacks.onError).toHaveBeenCalledTimes(1);
	});

	test('runInteraction wraps a non-error rejection', async () => {
		const { player } = createPlayer();
		player.runInteraction(() => Promise.reject('string failure'));
		await Promise.resolve();
		await Promise.resolve();
		expect(player.errorMessage).toBe('Video player interaction failed.');
	});
});

describe('VideoPlayerState keyboard shortcuts', () => {
	test('space and k toggle playback', () => {
		const { player, element } = createPlayer();
		expect(dispatchKeydown(player, ' ').defaultPrevented).toBe(true);
		expect(element.play).toHaveBeenCalledTimes(1);

		player.paused = true;
		dispatchKeydown(player, 'K');
		expect(element.play).toHaveBeenCalledTimes(2);
	});

	test('arrow left and right seek by the seek step', () => {
		const { player, element } = createPlayer({ seekStep: 10 });
		player.duration = 120;
		player.currentTime = 50;

		dispatchKeydown(player, 'ArrowRight');
		expect(element.currentTime).toBe(60);

		player.currentTime = 50;
		dispatchKeydown(player, 'ArrowLeft');
		expect(element.currentTime).toBe(40);
	});

	test('arrow up and down change the volume by the volume step', () => {
		const { player, element } = createPlayer({ volumeStep: 0.1 });
		player.setVolume(0.5);

		dispatchKeydown(player, 'ArrowUp');
		expect(element.volume).toBeCloseTo(0.6, 5);

		dispatchKeydown(player, 'ArrowDown');
		expect(element.volume).toBeCloseTo(0.5, 5);
	});

	test('m toggles muting', () => {
		const { player, element } = createPlayer();
		dispatchKeydown(player, 'm');
		expect(element.muted).toBe(true);
		dispatchKeydown(player, 'M');
		expect(element.muted).toBe(false);
	});

	test('f requests fullscreen', () => {
		const { player } = createPlayer();
		const root = document.createElement('div');
		const requestFullscreen = vi.fn(async () => undefined);
		Object.assign(root, { requestFullscreen });
		player.rootElement = root;
		setDocumentProperty('fullscreenElement', null);

		dispatchKeydown(player, 'f');
		expect(requestFullscreen).toHaveBeenCalledTimes(1);
	});

	test('p requests picture in picture', () => {
		const { player, element } = createPlayer();
		setDocumentProperty(
			'exitPictureInPicture',
			vi.fn(async () => undefined)
		);
		setDocumentProperty('pictureInPictureElement', null);

		dispatchKeydown(player, 'p');
		expect(element.requestPictureInPicture).toHaveBeenCalledTimes(1);
	});

	test('c toggles captions', () => {
		const { player, callbacks } = createPlayer({
			element: { textTracks: [createTextTrack()] }
		});
		dispatchKeydown(player, 'c');
		expect(player.captionsEnabled).toBe(true);
		expect(callbacks.onCaptionsChange).toHaveBeenCalledTimes(1);
	});

	test('ignores keys typed inside form controls', () => {
		const { player, element } = createPlayer();
		const input = document.createElement('input');
		document.body.append(input);
		const event = dispatchKeydown(player, ' ', input);
		expect(event.defaultPrevented).toBe(false);
		expect(element.play).not.toHaveBeenCalled();
		input.remove();
	});

	test('ignores keys typed inside a textarea', () => {
		const { player, element } = createPlayer();
		const textarea = document.createElement('textarea');
		document.body.append(textarea);
		dispatchKeydown(player, ' ', textarea);
		expect(element.play).not.toHaveBeenCalled();
		textarea.remove();
	});

	test('ignores keys inside a contenteditable region', () => {
		const { player, element } = createPlayer();
		const editable = document.createElement('div');
		editable.setAttribute('contenteditable', 'true');
		document.body.append(editable);
		dispatchKeydown(player, ' ', editable);
		expect(element.play).not.toHaveBeenCalled();
		editable.remove();
	});

	test('applies the shared ignore rule: links with an href, but not plain markup', () => {
		const { player, element } = createPlayer();
		const link = document.createElement('a');
		link.href = '#somewhere';
		document.body.append(link);
		dispatchKeydown(player, ' ', link);
		expect(element.play).not.toHaveBeenCalled();
		link.remove();

		const span = document.createElement('span');
		document.body.append(span);
		expect(dispatchKeydown(player, ' ', span).defaultPrevented).toBe(true);
		expect(element.play).toHaveBeenCalledTimes(1);
		span.remove();
	});

	test('ignores every shortcut while disabled', () => {
		const { player, element } = createPlayer({ disabled: true });
		const event = dispatchKeydown(player, ' ');
		expect(event.defaultPrevented).toBe(false);
		expect(element.play).not.toHaveBeenCalled();
	});
});

describe('VideoPlayerState fullscreen and picture in picture', () => {
	test('toggleFullscreen exits when the root is already fullscreen', async () => {
		const { player } = createPlayer();
		const root = document.createElement('div');
		player.rootElement = root;
		const exitFullscreen = vi.fn(async () => undefined);
		setDocumentProperty('fullscreenElement', root);
		setDocumentProperty('exitFullscreen', exitFullscreen);

		await player.toggleFullscreen();
		expect(exitFullscreen).toHaveBeenCalledTimes(1);
	});

	test('toggleFullscreen throws when the root is not mounted', async () => {
		const { player } = createPlayer();
		player.rootElement = null;
		setDocumentProperty('fullscreenElement', document.createElement('div'));
		await expect(player.toggleFullscreen()).rejects.toThrow('Video player root is not mounted.');
	});

	test('handleFullscreenChange mirrors the document state', () => {
		const { player, callbacks } = createPlayer();
		const root = document.createElement('div');
		player.rootElement = root;
		setDocumentProperty('fullscreenElement', root);

		player.handleFullscreenChange();
		expect(player.fullscreen).toBe(true);
		expect(player.snapshot.fullscreen).toBe(true);

		setDocumentProperty('fullscreenElement', null);
		player.handleFullscreenChange();
		expect(player.fullscreen).toBe(false);
		expect(callbacks.onFullscreenChange).toHaveBeenCalledTimes(2);
	});

	test('togglePictureInPicture exits when the element is already in picture in picture', async () => {
		const { player } = createPlayer();
		const exitPictureInPicture = vi.fn(async () => undefined);
		setDocumentProperty('exitPictureInPicture', exitPictureInPicture);
		setDocumentProperty('pictureInPictureElement', player.mediaElement);

		await player.togglePictureInPicture();
		expect(exitPictureInPicture).toHaveBeenCalledTimes(1);
	});

	test('togglePictureInPicture throws when unsupported', async () => {
		const { player } = createPlayer({ element: {} });
		setDocumentProperty('exitPictureInPicture', undefined);
		await expect(player.togglePictureInPicture()).rejects.toThrow(
			'Picture-in-Picture is not supported in this browser.'
		);
	});

	test('reports browser support from the mounted elements', () => {
		const { player } = createPlayer();
		const root = document.createElement('div');
		Object.assign(root, { requestFullscreen: vi.fn(async () => undefined) });
		player.rootElement = root;
		setDocumentProperty(
			'exitFullscreen',
			vi.fn(async () => undefined)
		);
		setDocumentProperty(
			'exitPictureInPicture',
			vi.fn(async () => undefined)
		);
		expect(player.supportsFullscreen).toBe(true);
		expect(player.supportsPictureInPicture).toBe(true);
	});

	test('picture in picture events update the snapshot', () => {
		const { player, callbacks } = createPlayer();
		player.handlePictureInPictureEnter();
		expect(player.pictureInPicture).toBe(true);
		expect(player.snapshot.pictureInPicture).toBe(true);

		player.handlePictureInPictureLeave();
		expect(player.pictureInPicture).toBe(false);
		expect(callbacks.onPictureInPictureChange).toHaveBeenCalledTimes(2);
	});
});

describe('VideoPlayerState captions', () => {
	test('setCaptionsEnabled shows the first caption track', () => {
		const english = createTextTrack({ label: 'English' });
		const french = createTextTrack({ label: 'French', language: 'fr' });
		const { player, callbacks } = createPlayer({ element: { textTracks: [english, french] } });

		player.setCaptionsEnabled(true);
		expect(english.mode).toBe('showing');
		expect(french.mode).toBe('disabled');
		expect(player.activeTextTrack).toBe('English');
		expect(callbacks.onCaptionsChange).toHaveBeenCalledTimes(1);
	});

	test('setCaptionsEnabled(false) disables every caption track', () => {
		const english = createTextTrack({ label: 'English', mode: 'showing' });
		const { player } = createPlayer({
			element: { textTracks: [english] },
			captionsEnabled: true,
			activeTextTrack: 'English'
		});

		player.setCaptionsEnabled(false);
		expect(english.mode).toBe('disabled');
		expect(player.captionsEnabled).toBe(false);
		expect(player.activeTextTrack).toBe(null);
	});

	test('setActiveTextTrack switches the showing track', () => {
		const english = createTextTrack({ label: 'English' });
		const french = createTextTrack({ label: 'French', language: 'fr' });
		const { player } = createPlayer({ element: { textTracks: [english, french] } });

		player.setActiveTextTrack('French');
		expect(french.mode).toBe('showing');
		expect(english.mode).toBe('disabled');
		expect(player.captionsEnabled).toBe(true);

		player.setActiveTextTrack(null);
		expect(french.mode).toBe('disabled');
		expect(player.captionsEnabled).toBe(false);
	});

	test('refreshMediaState reads captions back from the element', () => {
		const english = createTextTrack({ label: 'English', mode: 'showing' });
		const { player } = createPlayer({ element: { textTracks: [english] } });

		player.refreshMediaState();
		expect(player.captionsEnabled).toBe(true);
		expect(player.activeTextTrack).toBe('English');
	});

	test('non caption tracks are ignored', () => {
		const descriptions = createTextTrack({ kind: 'descriptions', label: 'Described' });
		const { player } = createPlayer({ element: { textTracks: [descriptions] } });

		player.setCaptionsEnabled(true);
		expect(descriptions.mode).toBe('disabled');
		expect(player.captionsEnabled).toBe(false);
		expect(player.activeTextTrack).toBe(null);
	});
});

describe('VideoPlayerState lifecycle', () => {
	test('handleLoadedMetadata restores the requested time and reports the duration', () => {
		const { player, element, callbacks } = createPlayer({ currentTime: 30 });
		element.duration = 90;
		player.isLoading = true;
		player.handleLoadedMetadata();
		expect(element.currentTime).toBe(30);
		expect(player.duration).toBe(90);
		expect(player.hasLoadedMetadata).toBe(true);
		expect(player.state).toBe('ready');
		expect(callbacks.onDurationChange).toHaveBeenCalledTimes(1);
	});

	test('handleLoadStart keeps the requested time and marks loading', () => {
		const { player } = createPlayer({ currentTime: 12 });
		player.hasLoadedMetadata = true;
		player.handleLoadStart();
		expect(player.isLoading).toBe(true);
		expect(player.hasLoadedMetadata).toBe(false);
		expect(player.currentTime).toBe(12);
		expect(player.state).toBe('loading');
	});

	test('media events forward the snapshot to callbacks', () => {
		const { player, element, callbacks } = createPlayer();
		element.currentTime = 5;
		player.handlePlay();
		player.handlePause();
		player.handleEnded();
		player.handleTimeUpdate();
		player.handleVolumeChange();
		expect(callbacks.onPlay).toHaveBeenCalledWith(expect.objectContaining({ currentTime: 5 }));
		expect(callbacks.onPause).toHaveBeenCalledTimes(1);
		expect(callbacks.onEnded).toHaveBeenCalledTimes(1);
		expect(callbacks.onTimeUpdate).toHaveBeenCalledTimes(1);
		expect(callbacks.onVolumeChange).toHaveBeenCalledTimes(1);
	});

	test('setLoop writes through and notifies', () => {
		const { player, element, callbacks } = createPlayer();
		player.setLoop(true);
		expect(element.loop).toBe(true);
		expect(player.loop).toBe(true);
		expect(callbacks.onLoopChange).toHaveBeenCalledTimes(1);
	});

	test('resetForSourceChange clears the loaded media and captions', () => {
		const { player } = createPlayer({ captionsEnabled: true, activeTextTrack: 'English' });
		player.hasLoadedMetadata = true;
		player.currentTime = 42;
		player.duration = 90;
		player.buffered = 50;
		player.ended = true;
		player.error = new Error('old');
		player.currentSrc = 'https://example.test/old.mp4';

		player.resetForSourceChange();

		expect(player.hasLoadedMetadata).toBe(false);
		expect(player.isLoading).toBe(true);
		expect(player.currentTime).toBe(0);
		expect(player.duration).toBe(0);
		expect(player.buffered).toBe(0);
		expect(player.ended).toBe(false);
		expect(player.paused).toBe(true);
		expect(player.error).toBe(null);
		expect(player.currentSrc).toBe('');
		expect(player.captionsEnabled).toBe(false);
		expect(player.activeTextTrack).toBe(null);
		expect(player.state).toBe('loading');
	});

	test('snapshot mirrors the player state', () => {
		const { player } = createPlayer();
		player.currentTime = 3;
		player.duration = 9;
		player.buffered = 4;
		player.volume = 0.5;
		player.muted = true;
		player.paused = false;
		player.ended = false;
		player.playbackRate = 1.25;
		player.loop = true;
		expect(player.snapshot).toEqual({
			currentTime: 3,
			duration: 9,
			buffered: 4,
			volume: 0.5,
			muted: true,
			paused: false,
			ended: false,
			playbackRate: 1.25,
			loop: true,
			fullscreen: false,
			pictureInPicture: false,
			captionsEnabled: false,
			activeTextTrack: null
		});
	});
});

describe('VideoPlayer transport', () => {
	test('renders the shared media icon buttons', () => {
		const { getAllByRole } = render(VideoPlayerHarness);
		expect(getAllByRole('button', { name: 'Play' }).length).toBeGreaterThan(0);
		expect(getAllByRole('button', { name: 'Fullscreen' }).length).toBeGreaterThan(0);
	});
});
