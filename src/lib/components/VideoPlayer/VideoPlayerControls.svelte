<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import { fastForwardIcon } from '../Icons/fastForward.js';
	import { pauseIcon } from '../Icons/pause.js';
	import { playIcon } from '../Icons/play.js';
	import { rewindIcon } from '../Icons/rewind.js';
	import type {
		VideoPlayerControl,
		VideoPlayerSource,
		VideoPlayerTimeVariant,
		VideoPlayerTrack
	} from './videoPlayer.props.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';
	import { formatVideoPlayerTime } from './videoPlayer.time.js';
	import MediaIconButton from '../MediaVolume/MediaIconButton.svelte';
	import VideoPlayerSecondaryControls from './VideoPlayerSecondaryControls.svelte';
	import VideoPlayerSettings from './VideoPlayerSettings.svelte';
	import VideoPlayerTimelineSlider from './VideoPlayerTimelineSlider.svelte';
	import VideoPlayerTime from './VideoPlayerTime.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		player,
		classes,
		size,
		controls,
		tracks,
		src,
		sources,
		download,
		playbackRates,
		timeVariant,
		seekStep,
		volumeStep,
		disabled,
		hasSource,
		visible,
		onOverlayOpenChange
	}: {
		player: VideoPlayerState;
		classes: VideoPlayerClasses;
		size: Sizes;
		controls: VideoPlayerControl[];
		tracks: VideoPlayerTrack[];
		src?: string;
		sources: VideoPlayerSource[];
		download: boolean | string;
		playbackRates: number[];
		timeVariant: VideoPlayerTimeVariant;
		seekStep: number;
		volumeStep: number;
		disabled: boolean;
		hasSource: boolean;
		visible: boolean;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();
	const t = $derived(useI18n());

	const controlSet = $derived(new Set(controls));
	const canSeek = $derived(player.duration > 0 && Number.isFinite(player.duration));
	const downloadHref = $derived(
		typeof download === 'string'
			? download
			: download
				? player.currentSrc || src || sources[0]?.src || ''
				: ''
	);

	// A status panel (no source, error, loading) sits in the centre of the frame, exactly where the
	// compact transport floats; while one shows there is nothing to transport, so the buttons yield.
	const statusShown = $derived(!hasSource || !!player.error || player.isLoading);

	function hasControl(control: VideoPlayerControl) {
		return controlSet.has(control);
	}
</script>

<div
	data-slot="video-player-controls"
	class={classes.controls({ size, visible })}
	aria-hidden={!visible}
	inert={!visible}
>
	<div class={classes.controlsBackdrop()}></div>

	{#if !statusShown && (hasControl('seekBackward') || hasControl('play') || hasControl('seekForward'))}
		<div data-slot="video-player-compact-transport" class={classes.compactTransport()}>
			{#if hasControl('seekBackward')}
				<MediaIconButton
					{size}
					class={classes.controlButton({ size, className: '!size-8 !min-w-8 [&_svg]:!size-4' })}
					label={t.mediaRewind(seekStep)}
					icon={rewindIcon}
					disabled={disabled || !canSeek}
					onPress={() => player.runInteraction(() => player.seekBy(-seekStep))}
				/>
			{/if}

			{#if hasControl('play')}
				<MediaIconButton
					{size}
					class={classes.controlButton({
						size,
						className: '!size-10 !min-w-10 !rounded-full !bg-white/15 [&_svg]:!size-5'
					})}
					label={player.paused || player.ended ? t.play : t.pause}
					icon={player.paused || player.ended ? playIcon : pauseIcon}
					{disabled}
					onPress={() => player.runInteraction(() => player.togglePlay())}
				/>
			{/if}

			{#if hasControl('seekForward')}
				<MediaIconButton
					{size}
					class={classes.controlButton({ size, className: '!size-8 !min-w-8 [&_svg]:!size-4' })}
					label={t.mediaForward(seekStep)}
					icon={fastForwardIcon}
					disabled={disabled || !canSeek}
					onPress={() => player.runInteraction(() => player.seekBy(seekStep))}
				/>
			{/if}
		</div>
	{/if}

	<div data-slot="video-player-controls-bar" class={classes.controlsBar({ size })}>
		{#if hasControl('seek')}
			<VideoPlayerTimelineSlider
				{classes}
				{size}
				label={t.seek}
				value={player.currentTime}
				min={0}
				max={player.duration}
				step={0.1}
				buffered={player.buffered}
				disabled={disabled || !canSeek}
				format={(value) => formatVideoPlayerTime(value)}
				onValueChange={(value) => player.runInteraction(() => player.seekTo(value))}
			/>
		{/if}

		<div data-slot="video-player-control-row" class={classes.controlRow({ size })}>
			<div data-slot="video-player-control-start" class={classes.controlStart({ size })}>
				{#if hasControl('time')}
					<VideoPlayerTime
						{classes}
						{size}
						currentTime={player.currentTime}
						duration={player.duration}
						variant={timeVariant}
					/>
				{/if}
			</div>

			<div data-slot="video-player-control-center" class={classes.controlCenter({ size })}>
				{#if hasControl('seekBackward')}
					<MediaIconButton
						{size}
						class={classes.controlButton({ size })}
						label={t.mediaRewind(seekStep)}
						icon={rewindIcon}
						disabled={disabled || !canSeek}
						onPress={() => player.runInteraction(() => player.seekBy(-seekStep))}
					/>
				{/if}

				{#if hasControl('play')}
					<MediaIconButton
						{size}
						class={classes.controlButton({ size })}
						label={player.paused || player.ended ? t.play : t.pause}
						icon={player.paused || player.ended ? playIcon : pauseIcon}
						{disabled}
						onPress={() => player.runInteraction(() => player.togglePlay())}
					/>
				{/if}

				{#if hasControl('seekForward')}
					<MediaIconButton
						{size}
						class={classes.controlButton({ size })}
						label={t.mediaForward(seekStep)}
						icon={fastForwardIcon}
						disabled={disabled || !canSeek}
						onPress={() => player.runInteraction(() => player.seekBy(seekStep))}
					/>
				{/if}
			</div>

			<div data-slot="video-player-control-end" class={classes.controlEnd({ size })}>
				<div data-slot="video-player-secondary-controls" class={classes.secondaryControls()}>
					<VideoPlayerSecondaryControls
						{player}
						{classes}
						{size}
						{controls}
						{tracks}
						{src}
						{sources}
						{download}
						{playbackRates}
						{volumeStep}
						{disabled}
						{onOverlayOpenChange}
					/>
				</div>

				<div data-slot="video-player-compact-settings" class={classes.compactSettings()}>
					<VideoPlayerSettings
						{player}
						{classes}
						{size}
						{tracks}
						{playbackRates}
						{volumeStep}
						{disabled}
						includeVolume={hasControl('volume')}
						includeRate={hasControl('settings') || hasControl('rate')}
						includeLoop={hasControl('settings') || hasControl('loop')}
						includeCaptions={hasControl('settings') || hasControl('captions')}
						includePictureInPicture={hasControl('pictureInPicture')}
						includeDownload={hasControl('download')}
						includeFullscreen={hasControl('fullscreen')}
						{downloadHref}
						{onOverlayOpenChange}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
