<script lang="ts">
	import type {
		VideoPlayerError,
		VideoPlayerProps as Props,
		VideoPlayerSnapshot
	} from './videoPlayer.props.js';
	import {
		VIDEO_PLAYER_DEFAULT_CONTROLS as DEFAULT_CONTROLS,
		VIDEO_PLAYER_DEFAULT_PLAYBACK_RATES as DEFAULT_PLAYBACK_RATES
	} from './videoPlayer.props.js';
	import VideoPlayerControls from './VideoPlayerControls.svelte';
	import VideoPlayerMedia from './VideoPlayerMedia.svelte';
	import VideoPlayerOverlays from './VideoPlayerOverlays.svelte';
	import { createVideoPlayerControlsVisibility } from './videoPlayer.controlsVisibility.svelte.js';
	import { createVideoPlayerLifecycle } from './videoPlayer.lifecycle.svelte.js';
	import { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import { useVideoPlayerTheme } from './videoPlayer.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		src,
		srcType,
		sources = [],
		tracks = [],
		poster,
		title,
		label,
		preload = 'metadata',
		crossOrigin,
		playsInline = true,
		autoplay = false,
		nativeControls = false,
		controls = DEFAULT_CONTROLS,
		playbackRates = DEFAULT_PLAYBACK_RATES,
		autoHideControls = true,
		hideControlsDelay = 1200,
		timeVariant = 'elapsed',
		download = true,
		disabled = false,
		size = 'normal',
		ratio = '16x9',
		class: className,
		ref = $bindable<HTMLVideoElement | null>(null),
		rootRef = $bindable<HTMLDivElement | null>(null),
		currentTime = $bindable(0),
		duration = $bindable(0),
		buffered = $bindable(0),
		volume = $bindable(1),
		muted = $bindable(false),
		paused = $bindable(true),
		ended = $bindable(false),
		playbackRate = $bindable(1),
		loop = $bindable(false),
		fullscreen = $bindable(false),
		pictureInPicture = $bindable(false),
		captionsEnabled = $bindable(false),
		activeTextTrack = $bindable<string | null>(null),
		error = $bindable<VideoPlayerError | null>(null),
		keyboardShortcuts = true,
		seekStep = 10,
		volumeStep = 0.05,
		children,
		overlay,
		loading,
		errorContent,
		empty,
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onDurationChange,
		onVolumeChange,
		onRateChange,
		onLoopChange,
		onFullscreenChange,
		onPictureInPictureChange,
		onCaptionsChange,
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
		onRateChange,
		onLoopChange,
		onFullscreenChange,
		onPictureInPictureChange,
		onCaptionsChange,
		onError
	});

	const player = new VideoPlayerState({
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
		get playbackRate() {
			return playbackRate;
		},
		set playbackRate(value: number) {
			playbackRate = value;
		},
		get loop() {
			return loop;
		},
		set loop(value: boolean) {
			loop = value;
		},
		get fullscreen() {
			return fullscreen;
		},
		set fullscreen(value: boolean) {
			fullscreen = value;
		},
		get pictureInPicture() {
			return pictureInPicture;
		},
		set pictureInPicture(value: boolean) {
			pictureInPicture = value;
		},
		get captionsEnabled() {
			return captionsEnabled;
		},
		set captionsEnabled(value: boolean) {
			captionsEnabled = value;
		},
		get activeTextTrack() {
			return activeTextTrack;
		},
		set activeTextTrack(value: string | null) {
			activeTextTrack = value;
		},
		get error() {
			return error;
		},
		set error(value: VideoPlayerError | null) {
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

	const classes = $derived(useVideoPlayerTheme(theme));
	const hasSource = $derived(Boolean(src || sources.length || children));
	const t = $derived(useI18n());
	const resolvedLabel = $derived(label ?? title ?? t.videoPlayer);
	const fullscreenState = $derived(player.actualFullscreen ? 'fullscreen' : 'windowed');
	const hasCustomControls = $derived(controls.length > 0);
	const sourceSignature = $derived(
		JSON.stringify({ src, srcType, sources, tracks, children: Boolean(children) })
	);
	const controlsVisibility = createVideoPlayerControlsVisibility({
		hasCustomControls: () => hasCustomControls,
		autoHideControls: () => autoHideControls,
		hideControlsDelay: () => hideControlsDelay,
		disabled: () => disabled,
		paused: () => paused
	});

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
	export function setPlaybackRate(nextPlaybackRate: number) {
		player.setPlaybackRate(nextPlaybackRate);
	}
	export function setLoop(nextLoop: boolean) {
		player.setLoop(nextLoop);
	}
	export function setCaptionsEnabled(nextCaptionsEnabled: boolean) {
		player.setCaptionsEnabled(nextCaptionsEnabled);
	}
	export function setActiveTextTrack(nextActiveTextTrack: string | null) {
		player.setActiveTextTrack(nextActiveTextTrack);
	}
	export function toggleFullscreen() {
		return player.toggleFullscreen();
	}
	export function togglePictureInPicture() {
		return player.togglePictureInPicture();
	}
	export function getSnapshot(): VideoPlayerSnapshot {
		return player.snapshot;
	}

	function handleRootKeydown(event: KeyboardEvent) {
		controlsVisibility.show();
		if (keyboardShortcuts) player.handleKeydown(event);
	}

	const lifecycle = createVideoPlayerLifecycle({
		player,
		sourceSignature: () => sourceSignature,
		onElementsChange: (mediaElement, rootElement) => {
			// Write-only bindable handles: the identity guards keep a re-mount from
			// republishing the same nodes to the parent binding.
			if (ref !== mediaElement) ref = mediaElement;
			if (rootRef !== rootElement) rootRef = rootElement;
		}
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	{@attach lifecycle.rootAttachment}
	data-slot="video-player"
	data-state={player.state}
	data-paused={paused ? 'true' : undefined}
	data-muted={muted ? 'true' : undefined}
	data-fullscreen={player.actualFullscreen ? 'true' : undefined}
	data-picture-in-picture={player.actualPictureInPicture ? 'true' : undefined}
	data-controls-visible={controlsVisibility.visible ? 'true' : undefined}
	role="region"
	aria-label={resolvedLabel}
	tabindex={keyboardShortcuts && !disabled ? 0 : undefined}
	class={classes.root({ size, disabled, fullscreen: fullscreenState, className })}
	onkeydown={handleRootKeydown}
	onfocusin={controlsVisibility.handleFocusIn}
	onfocusout={controlsVisibility.handleFocusOut}
	onpointerdown={controlsVisibility.show}
	onpointermove={controlsVisibility.show}
	onpointerleave={controlsVisibility.scheduleHide}
	{...attachments}
>
	<VideoPlayerMedia
		state={player}
		attachment={lifecycle.mediaAttachment}
		{classes}
		{size}
		{ratio}
		{src}
		{srcType}
		{sources}
		{tracks}
		{poster}
		{title}
		label={resolvedLabel}
		{preload}
		{crossOrigin}
		{playsInline}
		{autoplay}
		{nativeControls}
		{muted}
		{loop}
		{disabled}
		{children}
	/>

	<VideoPlayerOverlays
		state={player}
		{classes}
		{size}
		{hasSource}
		{overlay}
		{loading}
		{errorContent}
		{empty}
	/>

	{#if hasCustomControls}
		<VideoPlayerControls
			{player}
			{classes}
			{size}
			{controls}
			{tracks}
			{src}
			{sources}
			{download}
			{playbackRates}
			{timeVariant}
			{seekStep}
			{volumeStep}
			{disabled}
			{hasSource}
			visible={controlsVisibility.visible}
			onOverlayOpenChange={controlsVisibility.setOverlayOpen}
		/>
	{/if}
</div>
