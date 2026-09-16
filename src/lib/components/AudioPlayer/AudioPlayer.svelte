<script lang="ts">
	import { browser } from '$app/environment';
	import {
		AUDIO_PLAYER_DEFAULT_CONTROLS as DEFAULT_CONTROLS,
		type AudioPlayerError,
		type AudioPlayerProps as Props,
		type AudioPlayerSnapshot
	} from './audioPlayer.props.js';
	import AudioPlayerShell from './AudioPlayerShell.svelte';
	import { AudioPlayerState } from './audioPlayer.state.svelte.js';
	import { useAudioPlayerTheme } from './audioPlayer.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import {
		generateAudioPlayerWaveformSamples,
		getAudioPlayerWaveformSamples
	} from './audioPlayer.waveform.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		src,
		srcType,
		sources = [],
		title,
		artist,
		artwork,
		label,
		preload = 'metadata',
		crossOrigin,
		autoplay = false,
		controls = DEFAULT_CONTROLS,
		variant = 'waveform',
		layout = 'block',
		color,
		waveform,
		waveformVariant = 'centered',
		waveformBars = 72,
		timeVariant = 'elapsed',
		download = true,
		disabled = false,
		size = 'normal',
		class: className,
		ref = $bindable<HTMLAudioElement | null>(null),
		rootRef = $bindable<HTMLDivElement | null>(null),
		currentTime = $bindable(0),
		duration = $bindable(0),
		buffered = $bindable(0),
		volume = $bindable(1),
		muted = $bindable(false),
		paused = $bindable(true),
		ended = $bindable(false),
		loop = $bindable(false),
		error = $bindable<AudioPlayerError | null>(null),
		keyboardShortcuts = true,
		seekStep = 10,
		volumeStep = 0.05,
		children,
		header,
		controlsSlot,
		leading,
		trailing,
		seek,
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onDurationChange,
		onVolumeChange,
		onLoopChange,
		onError,
		theme,
		...attachments
	}: Props = $props();

	const callbacks = $derived({
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onDurationChange,
		onVolumeChange,
		onLoopChange,
		onError
	});

	const player = new AudioPlayerState({
		get currentTime() {
			return currentTime;
		},
		set currentTime(value: number) {
			currentTime = value;
		},
		get duration() {
			return duration;
		},
		set duration(value: number) {
			duration = value;
		},
		get buffered() {
			return buffered;
		},
		set buffered(value: number) {
			buffered = value;
		},
		get volume() {
			return volume;
		},
		set volume(value: number) {
			volume = value;
		},
		get muted() {
			return muted;
		},
		set muted(value: boolean) {
			muted = value;
		},
		get paused() {
			return paused;
		},
		set paused(value: boolean) {
			paused = value;
		},
		get ended() {
			return ended;
		},
		set ended(value: boolean) {
			ended = value;
		},
		get loop() {
			return loop;
		},
		set loop(value: boolean) {
			loop = value;
		},
		get error() {
			return error;
		},
		set error(value: AudioPlayerError | null) {
			error = value;
		},
		get disabled() {
			return disabled;
		},
		get seekStep() {
			return seekStep;
		},
		get volumeStep() {
			return volumeStep;
		},
		get callbacks() {
			return callbacks;
		}
	});

	let previousSourceSignature = $state('');
	let generatedWaveform = $state<number[] | undefined>();
	let waveformGenerationId = 0;

	const classes = $derived(useAudioPlayerTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const hasSource = $derived(Boolean(src || sources.length || children));
	const t = $derived(useI18n());
	const resolvedTitle = $derived(title ?? t.untitledAudio);
	const resolvedLabel = $derived(label ?? resolvedTitle ?? t.audioPlayer);
	const shellAttachments = $derived(attachments as Record<string, unknown>);
	const sourceSignature = $derived(
		JSON.stringify({ src, srcType, sources, children: Boolean(children) })
	);
	const waveformSource = $derived(src || sources[0]?.src);
	const providedWaveformSamples = $derived(waveform && waveform.length > 0 ? waveform : undefined);
	const displayedWaveformSamples = $derived(providedWaveformSamples ?? generatedWaveform);
	const waveformSamples = $derived(
		getAudioPlayerWaveformSamples(
			displayedWaveformSamples,
			waveformBars,
			`${waveformSource ?? ''}:${resolvedTitle}:${artist ?? ''}`
		)
	);

	export function play() {
		return player.play();
	}
	export function pause() {
		player.pause();
	}
	export function togglePlay() {
		return player.togglePlay();
	}
	export function load() {
		player.load();
	}
	export function seekTo(time: number) {
		player.seekTo(time);
	}
	export function seekBy(delta: number) {
		player.seekBy(delta);
	}
	export function setVolume(nextVolume: number) {
		player.setVolume(nextVolume);
	}
	export function setMuted(nextMuted: boolean) {
		player.setMuted(nextMuted);
	}
	export function setLoop(nextLoop: boolean) {
		player.setLoop(nextLoop);
	}
	export function getSnapshot(): AudioPlayerSnapshot {
		return player.snapshot;
	}

	$effect(() => {
		if (ref !== player.mediaElement) ref = player.mediaElement;
		if (rootRef !== player.rootElement) rootRef = player.rootElement;
	});

	$effect(() => {
		player.syncMediaProperties();
	});

	$effect(() => {
		const currentSource = waveformSource;
		const currentWaveform = providedWaveformSamples;
		const currentWaveformBars = waveformBars;
		const currentCrossOrigin = crossOrigin;

		waveformGenerationId += 1;
		const generationId = waveformGenerationId;
		if (!browser || currentWaveform || !currentSource) {
			generatedWaveform = undefined;
			return;
		}

		generatedWaveform = undefined;
		generateAudioPlayerWaveformSamples({
			src: currentSource,
			count: currentWaveformBars,
			crossOrigin: currentCrossOrigin
		})
			.then((samples) => {
				if (generationId !== waveformGenerationId) return;
				generatedWaveform = samples;
			})
			.catch((cause: unknown) => {
				if (generationId !== waveformGenerationId) return;
				generatedWaveform = undefined;
				const waveformError =
					cause instanceof Error ? cause : new Error('Audio waveform generation failed.');
				player.callbacks.onError?.({ error: waveformError, snapshot: player.snapshot });
			});
	});

	$effect(() => {
		if (!previousSourceSignature) {
			previousSourceSignature = sourceSignature;
			return;
		}
		if (sourceSignature === previousSourceSignature) return;
		previousSourceSignature = sourceSignature;
		player.resetForSourceChange();
		player.mediaElement?.load();
	});
</script>

<AudioPlayerShell
	{player}
	{classes}
	{size}
	color={resolvedColor}
	{disabled}
	{className}
	attachments={shellAttachments}
	{keyboardShortcuts}
	{hasSource}
	{resolvedLabel}
	{src}
	{srcType}
	{sources}
	{preload}
	{crossOrigin}
	{autoplay}
	{muted}
	{loop}
	{children}
	title={resolvedTitle}
	{artist}
	{artwork}
	{header}
	{controlsSlot}
	{leading}
	{trailing}
	{controls}
	{download}
	{timeVariant}
	{seekStep}
	{volumeStep}
	{variant}
	{layout}
	{waveformVariant}
	{waveformSamples}
	{seek}
/>
