import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { VoiceInputResult } from './voiceInput.props.js';
import { drawVoiceInputWaveform, resizeVoiceInputCanvas } from './voiceInput.waveform.js';

export type VoiceInputStatus = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error';

type VoiceInputStateOptions = {
	getDisabled: () => boolean;
	getDuration: () => number;
	getMaxDuration: () => number | null;
	getValue: () => Blob | null;
	setControlNode: (node: HTMLElement | null) => void;
	setFocused: (focused: boolean) => void;
	setValue: (value: Blob | null) => void;
	setDuration: (duration: number) => void;
	onStart?: () => void;
	onStop?: (result: VoiceInputResult) => void;
	onError?: (error: Error) => void;
};

type WindowWithWebkitAudioContext = Window &
	typeof globalThis & {
		webkitAudioContext?: typeof AudioContext;
	};

const SAMPLE_INTERVAL = 48;
const DURATION_INTERVAL = 100;
const MAX_SAMPLES = 2048;
const SIGNAL_FLOOR_DB = -52;
const SIGNAL_CEILING_DB = -10;

export class VoiceInputState {
	status = $state<VoiceInputStatus>('idle');
	errorMessage = $state<string | null>(null);
	duration = $state(0);
	level = $state(0);
	isPlaying = $state(false);
	playbackCurrentTime = $state(0);
	playbackDuration = $state(0);
	samples = $state<number[]>([]);

	private ownerWindow: WindowWithWebkitAudioContext | null = null;
	private recorder: MediaRecorder | null = null;
	private stream: MediaStream | null = null;
	private audioContext: AudioContext | null = null;
	private source: MediaStreamAudioSourceNode | null = null;
	private analyser: AnalyserNode | null = null;
	private timeDomainData: Float32Array<ArrayBuffer> | null = null;
	private playbackValue = $state<Blob | null>(null);
	private playbackAudio: HTMLAudioElement | null = null;
	private playbackUrl: string | null = null;
	private playbackUrlOwner: typeof URL | null = null;
	private playbackFailed = false;
	private chunks: Blob[] = [];
	private animationFrame: number | null = null;
	private maxDurationTimeout: number | null = null;
	private startedAt = 0;
	private lastSampleAt = 0;
	private lastDurationAt = 0;
	private requestVersion = 0;

	constructor(private options: VoiceInputStateOptions) {
		this.duration = options.getDuration();
		this.playbackDuration = options.getValue() ? options.getDuration() : 0;
	}

	get isRecording() {
		return this.status === 'recording';
	}

	get isStopping() {
		return this.status === 'stopping';
	}

	get isBusy() {
		return this.status === 'requesting' || this.status === 'stopping';
	}

	get playbackProgress() {
		if (this.playbackDuration <= 0) return 0;
		return clamp(this.playbackCurrentTime / this.playbackDuration, 0, 1);
	}

	trigger: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			const ownerWindow = node.ownerDocument.defaultView as WindowWithWebkitAudioContext | null;
			this.ownerWindow = ownerWindow;
			this.options.setControlNode(node);
			const handleFocus = () => this.options.setFocused(true);
			const handleBlur = () => this.options.setFocused(false);
			node.addEventListener('focus', handleFocus);
			node.addEventListener('blur', handleBlur);

			$effect(() => {
				node.style.setProperty(
					'--voice-input-level',
					this.isRecording ? this.level.toFixed(3) : '0'
				);
			});

			$effect(() => {
				this.syncPlaybackValue(this.options.getValue(), this.options.getDuration());
			});

			return () => {
				node.removeEventListener('focus', handleFocus);
				node.removeEventListener('blur', handleBlur);
				node.style.removeProperty('--voice-input-level');
				this.options.setFocused(false);
				this.options.setControlNode(null);
				this.dispose();
				if (this.ownerWindow === ownerWindow) this.ownerWindow = null;
			};
		});

	waveform: Attachment<HTMLCanvasElement> = (canvas) =>
		untrack(() => {
			const context = canvas.getContext('2d');
			if (!context) throw new Error('VoiceInput requires a 2D canvas context.');

			const draw = () =>
				drawVoiceInputWaveform(
					canvas,
					context,
					this.samples,
					this.playbackValue ? this.playbackProgress : null
				);
			const resize = () => {
				resizeVoiceInputCanvas(canvas, context);
				draw();
			};
			const observer =
				typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize());
			observer?.observe(canvas);
			resize();

			$effect(() => {
				draw();
			});

			return () => {
				observer?.disconnect();
			};
		});

	start = async () => {
		if (this.options.getDisabled() || this.isBusy || this.isRecording) return;
		this.pausePlayback();

		const ownerWindow = this.ownerWindow;
		const AudioContextConstructor = ownerWindow?.AudioContext ?? ownerWindow?.webkitAudioContext;
		if (!ownerWindow?.navigator.mediaDevices?.getUserMedia) {
			this.fail(new Error('Microphone access requires a secure context and a supported browser.'));
			return;
		}
		if (!ownerWindow.MediaRecorder) {
			this.fail(new Error('Audio recording is not supported by this browser.'));
			return;
		}
		if (!AudioContextConstructor) {
			this.fail(new Error('Live microphone visualization requires Web Audio API.'));
			return;
		}

		const requestVersion = ++this.requestVersion;
		this.status = 'requesting';
		this.errorMessage = null;

		try {
			const stream = await ownerWindow.navigator.mediaDevices.getUserMedia({ audio: true });
			if (requestVersion !== this.requestVersion || this.ownerWindow !== ownerWindow) {
				stopStream(stream);
				return;
			}

			const recorder = new ownerWindow.MediaRecorder(stream);
			const audioContext = new AudioContextConstructor();
			const analyser = audioContext.createAnalyser();
			const source = audioContext.createMediaStreamSource(stream);
			analyser.fftSize = 2048;
			analyser.smoothingTimeConstant = 0.82;
			source.connect(analyser);

			this.stream = stream;
			this.recorder = recorder;
			this.audioContext = audioContext;
			this.source = source;
			this.analyser = analyser;
			this.timeDomainData = new Float32Array(analyser.fftSize);
			this.chunks = [];
			this.attachRecorder(recorder);

			if (audioContext.state === 'suspended') await audioContext.resume();
			if (requestVersion !== this.requestVersion || this.ownerWindow !== ownerWindow) return;

			recorder.start();
			this.samples = [];
			this.level = 0;
			this.setDuration(0);
			this.releasePlayback();
			this.options.setValue(null);
			this.startedAt = ownerWindow.performance.now();
			this.lastSampleAt = this.startedAt - SAMPLE_INTERVAL;
			this.lastDurationAt = this.startedAt - DURATION_INTERVAL;
			this.status = 'recording';
			this.startAnimation();
			this.scheduleMaxDurationStop();
			this.options.onStart?.();
		} catch (cause) {
			if (requestVersion !== this.requestVersion) return;
			this.fail(toVoiceInputError(cause));
		}
	};

	stop = () => {
		if (!this.isRecording) return;
		const recorder = this.recorder;
		if (!recorder || recorder.state === 'inactive') {
			this.fail(new Error('The microphone recorder stopped unexpectedly.'));
			return;
		}

		this.updateDuration();
		this.clearMaxDurationTimeout();
		this.status = 'stopping';
		this.stopAnimation();
		recorder.stop();
	};

	togglePlayback = () => {
		if (this.options.getDisabled()) return;
		const value = this.options.getValue();
		if (!value) return;

		try {
			this.syncPlaybackValue(value, this.options.getDuration());
			const audio = this.getPlaybackAudio(value);
			if (!audio.paused && !audio.ended) {
				audio.pause();
				return;
			}
			if (audio.ended) {
				audio.currentTime = 0;
				this.playbackCurrentTime = 0;
			}
			this.playbackFailed = false;
			void audio.play().catch((cause: unknown) => this.reportPlaybackError(cause));
		} catch (cause) {
			this.reportPlaybackError(cause);
		}
	};

	seekPlayback = (time: number) => {
		if (this.options.getDisabled()) return;
		const value = this.options.getValue();
		if (!value || this.playbackDuration <= 0) return;

		try {
			this.syncPlaybackValue(value, this.options.getDuration());
			const audio = this.getPlaybackAudio(value);
			const nextTime = clamp(time, 0, this.playbackDuration);
			audio.currentTime = nextTime;
			this.playbackCurrentTime = nextTime;
		} catch (cause) {
			this.reportPlaybackError(cause);
		}
	};

	pausePlayback = () => {
		this.playbackAudio?.pause();
	};

	clear = () => {
		if (this.options.getDisabled() || this.isRecording || this.isBusy) return;
		this.pausePlayback();
		this.releasePlayback();
		this.samples = [];
		this.level = 0;
		this.setDuration(0);
		this.errorMessage = null;
		this.status = 'idle';
		this.options.setValue(null);
	};

	cancelPending() {
		if (this.status !== 'requesting') return;
		this.requestVersion += 1;
		this.detachRecorder();
		if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
		this.releaseCapture();
		this.status = 'idle';
	}

	dispose() {
		this.requestVersion += 1;
		this.stopAnimation();
		this.detachRecorder();
		if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
		this.releaseCapture();
		this.releasePlayback();
		this.status = 'idle';
	}

	private startAnimation() {
		const ownerWindow = this.ownerWindow;
		if (!ownerWindow) return;

		const update = (time: number) => {
			if (!this.isRecording || !this.analyser || !this.timeDomainData) return;
			if (time - this.lastSampleAt >= SAMPLE_INTERVAL) {
				this.analyser.getFloatTimeDomainData(this.timeDomainData);
				this.appendSample(readSignalLevel(this.timeDomainData));
				this.lastSampleAt = time;
			}
			if (time - this.lastDurationAt >= DURATION_INTERVAL) {
				this.updateDuration(time);
				this.lastDurationAt = time;
			}
			this.animationFrame = ownerWindow.requestAnimationFrame(update);
		};

		this.animationFrame = ownerWindow.requestAnimationFrame(update);
	}

	private stopAnimation() {
		this.level = 0;
		if (this.animationFrame === null || !this.ownerWindow) return;
		this.ownerWindow.cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;
	}

	private scheduleMaxDurationStop() {
		const ownerWindow = this.ownerWindow;
		const maxDuration = this.options.getMaxDuration();
		if (!ownerWindow || maxDuration === null) return;
		this.clearMaxDurationTimeout();
		this.maxDurationTimeout = ownerWindow.setTimeout(this.stop, maxDuration * 1000);
	}

	private clearMaxDurationTimeout() {
		if (this.maxDurationTimeout === null || !this.ownerWindow) return;
		this.ownerWindow.clearTimeout(this.maxDurationTimeout);
		this.maxDurationTimeout = null;
	}

	private appendSample(sample: number) {
		this.level = sample;
		const nextSamples = [...this.samples, sample];
		this.samples = nextSamples.length > MAX_SAMPLES ? nextSamples.slice(-MAX_SAMPLES) : nextSamples;
	}

	private syncPlaybackValue(value: Blob | null, fallbackDuration: number) {
		if (value === this.playbackValue) {
			if (!value) {
				this.playbackCurrentTime = 0;
				this.playbackDuration = 0;
				return;
			}
			this.refreshPlaybackDuration(fallbackDuration);
			return;
		}
		this.releasePlayback();
		this.playbackValue = value;
		this.playbackDuration = value ? Math.max(0, fallbackDuration) : 0;
	}

	private getPlaybackAudio(value: Blob) {
		if (this.playbackAudio && value === this.playbackValue) return this.playbackAudio;
		const ownerWindow = this.ownerWindow;
		if (!ownerWindow) throw new Error('Audio playback is unavailable before the control mounts.');

		this.syncPlaybackValue(value, this.options.getDuration());
		const url = ownerWindow.URL.createObjectURL(value);
		try {
			const audio = ownerWindow.document.createElement('audio');
			audio.preload = 'metadata';
			audio.src = url;
			audio.addEventListener('play', this.handlePlaybackPlay);
			audio.addEventListener('pause', this.handlePlaybackPause);
			audio.addEventListener('ended', this.handlePlaybackEnded);
			audio.addEventListener('timeupdate', this.handlePlaybackTimeUpdate);
			audio.addEventListener('loadedmetadata', this.handlePlaybackDurationValueChange);
			audio.addEventListener('durationchange', this.handlePlaybackDurationValueChange);
			audio.addEventListener('error', this.handlePlaybackError);
			this.playbackAudio = audio;
			this.playbackUrl = url;
			this.playbackUrlOwner = ownerWindow.URL;
			return audio;
		} catch (cause) {
			ownerWindow.URL.revokeObjectURL(url);
			throw cause;
		}
	}

	private releasePlayback() {
		const audio = this.playbackAudio;
		if (audio) {
			audio.removeEventListener('play', this.handlePlaybackPlay);
			audio.removeEventListener('pause', this.handlePlaybackPause);
			audio.removeEventListener('ended', this.handlePlaybackEnded);
			audio.removeEventListener('timeupdate', this.handlePlaybackTimeUpdate);
			audio.removeEventListener('loadedmetadata', this.handlePlaybackDurationValueChange);
			audio.removeEventListener('durationchange', this.handlePlaybackDurationValueChange);
			audio.removeEventListener('error', this.handlePlaybackError);
			audio.pause();
			audio.removeAttribute('src');
			audio.load();
		}
		if (this.playbackUrl && this.playbackUrlOwner) {
			this.playbackUrlOwner.revokeObjectURL(this.playbackUrl);
		}
		this.playbackValue = null;
		this.playbackAudio = null;
		this.playbackUrl = null;
		this.playbackUrlOwner = null;
		this.playbackFailed = false;
		this.isPlaying = false;
		this.playbackCurrentTime = 0;
		this.playbackDuration = 0;
	}

	private handlePlaybackPlay = () => {
		this.isPlaying = true;
	};

	private handlePlaybackPause = () => {
		this.isPlaying = false;
	};

	private handlePlaybackEnded = () => {
		this.isPlaying = false;
		this.playbackCurrentTime = this.playbackDuration;
	};

	private handlePlaybackTimeUpdate = () => {
		const audio = this.playbackAudio;
		if (!audio) return;
		this.playbackCurrentTime = clamp(audio.currentTime, 0, this.playbackDuration);
	};

	private handlePlaybackDurationValueChange = () => {
		this.refreshPlaybackDuration(this.options.getDuration());
	};

	private handlePlaybackError = () => {
		this.reportPlaybackError(this.playbackAudio?.error);
	};

	private reportPlaybackError(cause: unknown) {
		if (this.playbackFailed) return;
		this.playbackFailed = true;
		this.isPlaying = false;
		const error = cause instanceof Error ? cause : new Error('The recording could not be played.');
		this.errorMessage = error.message;
		this.status = 'error';
		this.options.onError?.(error);
	}

	private refreshPlaybackDuration(fallbackDuration: number) {
		const mediaDuration = this.playbackAudio?.duration;
		this.playbackDuration =
			mediaDuration && Number.isFinite(mediaDuration)
				? mediaDuration
				: Math.max(0, fallbackDuration);
		this.playbackCurrentTime = clamp(this.playbackCurrentTime, 0, this.playbackDuration);
	}

	private updateDuration(now = this.ownerWindow?.performance.now()) {
		if (now === undefined || this.startedAt === 0) return;
		const elapsed = Math.max(0, (now - this.startedAt) / 1000);
		const maxDuration = this.options.getMaxDuration();
		this.setDuration(maxDuration === null ? elapsed : Math.min(elapsed, maxDuration));
	}

	private setDuration(duration: number) {
		this.duration = duration;
		this.options.setDuration(duration);
	}

	private attachRecorder(recorder: MediaRecorder) {
		recorder.addEventListener('dataavailable', this.handleDataAvailable);
		recorder.addEventListener('stop', this.handleRecorderStop);
		recorder.addEventListener('error', this.handleRecorderError);
	}

	private detachRecorder() {
		if (!this.recorder) return;
		this.recorder.removeEventListener('dataavailable', this.handleDataAvailable);
		this.recorder.removeEventListener('stop', this.handleRecorderStop);
		this.recorder.removeEventListener('error', this.handleRecorderError);
	}

	private handleDataAvailable = (event: BlobEvent) => {
		if (event.data.size > 0) this.chunks.push(event.data);
	};

	private handleRecorderStop = () => {
		const recorder = this.recorder;
		if (!recorder) return;

		this.updateDuration();
		const mimeType = recorder.mimeType || this.chunks[0]?.type;
		const blob = mimeType ? new Blob(this.chunks, { type: mimeType }) : new Blob(this.chunks);
		const result = { blob, duration: this.duration } satisfies VoiceInputResult;

		this.detachRecorder();
		this.releaseCapture();
		this.status = 'idle';
		this.samples = [...this.samples];
		this.options.setValue(blob);
		this.options.onStop?.(result);
	};

	private handleRecorderError = (event: Event) => {
		const cause = event instanceof ErrorEvent ? event.error : undefined;
		this.fail(cause instanceof Error ? cause : new Error('Audio recording failed.'));
	};

	private fail(error: Error) {
		this.requestVersion += 1;
		this.stopAnimation();
		this.detachRecorder();
		if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
		this.releaseCapture();
		this.errorMessage = error.message;
		this.status = 'error';
		this.options.onError?.(error);
	}

	private releaseCapture() {
		this.clearMaxDurationTimeout();
		this.source?.disconnect();
		this.analyser?.disconnect();
		stopStream(this.stream);
		if (this.audioContext && this.audioContext.state !== 'closed') {
			void this.audioContext.close();
		}
		this.recorder = null;
		this.stream = null;
		this.audioContext = null;
		this.source = null;
		this.analyser = null;
		this.timeDomainData = null;
		this.chunks = [];
		this.startedAt = 0;
	}
}

function readSignalLevel(samples: Float32Array<ArrayBuffer>) {
	let squareSum = 0;
	for (const sample of samples) squareSum += sample * sample;
	const rms = Math.sqrt(squareSum / samples.length);
	if (rms === 0) return 0;

	const decibels = 20 * Math.log10(rms);
	return Math.min(
		1,
		Math.max(0, (decibels - SIGNAL_FLOOR_DB) / (SIGNAL_CEILING_DB - SIGNAL_FLOOR_DB))
	);
}

function stopStream(stream: MediaStream | null) {
	stream?.getTracks().forEach((track) => track.stop());
}

function toVoiceInputError(cause: unknown) {
	if (!(cause instanceof DOMException)) {
		return cause instanceof Error ? cause : new Error('Could not start microphone recording.');
	}

	if (cause.name === 'NotAllowedError' || cause.name === 'SecurityError') {
		return new Error('Microphone access was denied.');
	}
	if (cause.name === 'NotFoundError') return new Error('No microphone was found.');
	if (cause.name === 'NotReadableError') {
		return new Error('The microphone is already in use or unavailable.');
	}
	return new Error(cause.message || 'Could not start microphone recording.');
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}
