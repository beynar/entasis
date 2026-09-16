import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import AudioPlayerHarness from './AudioPlayerHarness.test.svelte';
import { AudioPlayerState } from './audioPlayer.state.svelte.js';

class FakeMediaElement {
	currentTime = 0;
	duration = 120;
	volume = 1;
	muted = false;
	paused = true;
	ended = false;
	loop = false;
	readyState = 1;
	currentSrc = 'https://example.test/track.mp3';
	error: MediaError | null = null;
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
	onLoopChange: vi.fn(),
	onError: vi.fn()
});

const createPlayer = (
	options: {
		element?: Partial<FakeMediaElement> | null;
		disabled?: boolean;
		duration?: number;
		currentTime?: number;
		volume?: number;
		muted?: boolean;
		seekStep?: number;
		volumeStep?: number;
	} = {}
) => {
	const callbacks = createCallbacks();
	const player = new AudioPlayerState({
		currentTime: options.currentTime ?? 0,
		duration: options.duration ?? 120,
		buffered: 0,
		volume: options.volume ?? 1,
		muted: options.muted ?? false,
		paused: true,
		ended: false,
		loop: false,
		error: null,
		disabled: options.disabled ?? false,
		seekStep: options.seekStep ?? 10,
		volumeStep: options.volumeStep ?? 0.05,
		callbacks
	});
	const element = options.element === null ? null : createMediaElement(options.element ?? {});
	player.mediaElement = element as unknown as HTMLAudioElement | null;
	return { player, element: element as FakeMediaElement, callbacks };
};

const dispatchKeydown = (player: AudioPlayerState, key: string, target?: HTMLElement) => {
	const host = target ?? document.createElement('div');
	if (!host.isConnected) document.body.append(host);
	host.addEventListener('keydown', player.handleKeydown);
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	host.dispatchEvent(event);
	host.removeEventListener('keydown', player.handleKeydown);
	return event;
};

describe('AudioPlayerState playback', () => {
	test('load delegates to the media element', () => {
		const { player, element } = createPlayer();
		player.load();
		expect(element.load).toHaveBeenCalledTimes(1);
	});

	test('load throws when no media element is mounted', () => {
		const { player } = createPlayer({ element: null });
		expect(() => player.load()).toThrow('Audio element is not mounted.');
	});

	test('play and pause delegate to the media element', async () => {
		const { player, element } = createPlayer();
		await player.play();
		expect(element.play).toHaveBeenCalledTimes(1);
		player.pause();
		expect(element.pause).toHaveBeenCalledTimes(1);
	});

	test('togglePlay plays when paused and pauses when playing', async () => {
		const { player, element } = createPlayer();
		player.paused = true;
		await player.togglePlay();
		expect(element.play).toHaveBeenCalledTimes(1);

		player.paused = false;
		player.ended = false;
		await player.togglePlay();
		expect(element.pause).toHaveBeenCalledTimes(1);
	});

	test('togglePlay restarts playback when ended', async () => {
		const { player, element } = createPlayer();
		player.paused = false;
		player.ended = true;
		await player.togglePlay();
		expect(element.play).toHaveBeenCalledTimes(1);
	});

	test('interactions throw when the player is disabled', async () => {
		const { player } = createPlayer({ disabled: true });
		await expect(player.play()).rejects.toThrow('Audio player is disabled.');
		expect(() => player.seekTo(5)).toThrow('Audio player is disabled.');
	});
});

describe('AudioPlayerState seeking', () => {
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
		const { player, element } = createPlayer({ seekStep: 15 });
		player.duration = 120;
		player.currentTime = 30;
		player.seekBy(15);
		expect(element.currentTime).toBe(45);
		player.seekBy(-100);
		expect(element.currentTime).toBe(0);
	});

	test('refreshMediaState reads the buffered range covering the current time', () => {
		const { player, element } = createPlayer();
		element.currentTime = 10;
		element.buffered = {
			length: 2,
			start: (index) => (index === 0 ? 0 : 60),
			end: (index) => (index === 0 ? 25 : 90)
		};
		player.refreshMediaState();
		expect(player.buffered).toBe(25);
	});
});

describe('AudioPlayerState volume', () => {
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

	test('setVolume above zero unmutes', () => {
		const { player, element } = createPlayer();
		element.muted = true;
		player.setVolume(0.6);
		expect(element.muted).toBe(false);
		expect(player.muted).toBe(false);
	});

	test('setMuted restores an audible volume when unmuting from zero', () => {
		const { player, element } = createPlayer({ volumeStep: 0.05 });
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
		expect(player.muted).toBe(true);

		player.toggleMuted();
		expect(element.muted).toBe(false);
		expect(player.muted).toBe(false);
	});

	test('toggleMuted unmutes a player sitting at zero volume', () => {
		const { player, element } = createPlayer();
		player.setVolume(0);
		player.toggleMuted();
		expect(element.muted).toBe(false);
		expect(element.volume).toBeGreaterThan(0);
	});
});

describe('AudioPlayerState errors', () => {
	test('maps media error codes to audio wording', () => {
		const { player } = createPlayer();
		const messages = [1, 2, 3, 4, 9].map((code) => {
			player.error = { code } as MediaError;
			return player.errorMessage;
		});
		expect(messages).toEqual([
			'Audio loading was aborted.',
			'A network error interrupted audio loading.',
			'The audio could not be decoded.',
			'The audio source is unsupported.',
			'Audio playback failed.'
		]);
	});

	test('uses the message of a thrown Error', () => {
		const { player } = createPlayer();
		player.error = new Error('boom');
		expect(player.errorMessage).toBe('boom');
	});

	test('returns an empty message with no error', () => {
		const { player } = createPlayer();
		expect(player.errorMessage).toBe('');
	});

	test('handleError reports the media error and leaves the loading state', () => {
		const { player, element, callbacks } = createPlayer();
		player.isLoading = true;
		element.error = { code: 2 } as MediaError;
		player.handleError();
		expect(player.errorMessage).toBe('A network error interrupted audio loading.');
		expect(player.isLoading).toBe(false);
		expect(player.state).toBe('error');
		expect(callbacks.onError).toHaveBeenCalledTimes(1);
	});

	test('runInteraction reports a rejected action', async () => {
		const { player, callbacks } = createPlayer();
		player.runInteraction(() => Promise.reject(new Error('nope')));
		await Promise.resolve();
		await Promise.resolve();
		expect(player.errorMessage).toBe('nope');
		expect(callbacks.onError).toHaveBeenCalledTimes(1);
	});

	test('runInteraction reports a synchronous throw', () => {
		const { player } = createPlayer();
		player.runInteraction(() => {
			throw new Error('sync boom');
		});
		expect(player.errorMessage).toBe('sync boom');
	});

	test('runInteraction wraps a non-error rejection', async () => {
		const { player } = createPlayer();
		player.runInteraction(() => Promise.reject('string failure'));
		await Promise.resolve();
		await Promise.resolve();
		expect(player.errorMessage).toBe('Audio interaction failed.');
	});
});

describe('AudioPlayerState keyboard shortcuts', () => {
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

	test('l toggles looping and notifies', () => {
		const { player, element, callbacks } = createPlayer();
		dispatchKeydown(player, 'l');
		expect(element.loop).toBe(true);
		expect(player.loop).toBe(true);
		expect(callbacks.onLoopChange).toHaveBeenCalledTimes(1);
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

describe('AudioPlayerState lifecycle', () => {
	test('handleLoadedMetadata restores the requested time and reports the duration', () => {
		const { player, element, callbacks } = createPlayer({ currentTime: 30 });
		element.duration = 90;
		player.isLoading = true;
		player.handleLoadedMetadata();
		expect(element.currentTime).toBe(30);
		expect(player.duration).toBe(90);
		expect(player.hasLoadedMetadata).toBe(true);
		expect(player.isLoading).toBe(false);
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
		expect(player.duration).toBe(0);
		expect(player.paused).toBe(true);
		expect(player.state).toBe('loading');
	});

	test('syncMediaProperties pushes volume, muted and loop onto the element', () => {
		const { player, element } = createPlayer();
		player.hasLoadedMetadata = true;
		player.volume = 0.25;
		player.muted = true;
		player.loop = true;
		player.currentTime = 10;
		player.duration = 120;
		player.syncMediaProperties();
		expect(element.volume).toBe(0.25);
		expect(element.muted).toBe(true);
		expect(element.loop).toBe(true);
		expect(element.currentTime).toBe(10);
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

	test('resetForSourceChange clears the loaded track', () => {
		const { player } = createPlayer();
		player.hasLoadedMetadata = true;
		player.currentTime = 42;
		player.duration = 90;
		player.buffered = 50;
		player.ended = true;
		player.error = new Error('old');
		player.currentSrc = 'https://example.test/old.mp3';

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
		player.loop = true;
		expect(player.snapshot).toEqual({
			currentTime: 3,
			duration: 9,
			buffered: 4,
			volume: 0.5,
			muted: true,
			paused: false,
			ended: false,
			loop: true
		});
	});
});

describe('AudioPlayer transport', () => {
	test('renders the shared media icon buttons', () => {
		const { getByRole } = render(AudioPlayerHarness);
		expect(getByRole('button', { name: 'Play' })).toBeInTheDocument();
		expect(getByRole('button', { name: 'Loop' })).toBeInTheDocument();
	});
});
