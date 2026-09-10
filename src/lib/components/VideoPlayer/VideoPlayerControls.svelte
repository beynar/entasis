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
	import VideoPlayerIconButton from './VideoPlayerIconButton.svelte';
	import VideoPlayerSecondaryControls from './VideoPlayerSecondaryControls.svelte';
	import VideoPlayerSettings from './VideoPlayerSettings.svelte';
	import VideoPlayerTimelineSlider from './VideoPlayerTimelineSlider.svelte';
	import VideoPlayerTime from './VideoPlayerTime.svelte';

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
		visible: boolean;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();

	const controlSet = $derived(new Set(controls));
	const canSeek = $derived(player.duration > 0 && Number.isFinite(player.duration));
	const downloadHref = $derived(
		typeof download === 'string'
			? download
			: download
				? player.currentSrc || src || sources[0]?.src || ''
				: ''
	);

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

	{#if hasControl('seekBackward') || hasControl('play') || hasControl('seekForward')}
		<div data-slot="video-player-compact-transport">
			{#if hasControl('seekBackward')}
				<VideoPlayerIconButton
					{classes}
					{size}
					label={`Rewind ${seekStep} seconds`}
					icon={rewindIcon}
					disabled={disabled || !canSeek}
					class="!size-8 !min-w-8 [&_svg]:!size-4"
					onPress={() => player.runInteraction(() => player.seekBy(-seekStep))}
				/>
			{/if}

			{#if hasControl('play')}
				<VideoPlayerIconButton
					{classes}
					{size}
					label={player.paused || player.ended ? 'Play' : 'Pause'}
					icon={player.paused || player.ended ? playIcon : pauseIcon}
					{disabled}
					class="!size-10 !min-w-10 !rounded-full !bg-white/15 [&_svg]:!size-5"
					onPress={() => player.runInteraction(() => player.togglePlay())}
				/>
			{/if}

			{#if hasControl('seekForward')}
				<VideoPlayerIconButton
					{classes}
					{size}
					label={`Forward ${seekStep} seconds`}
					icon={fastForwardIcon}
					disabled={disabled || !canSeek}
					class="!size-8 !min-w-8 [&_svg]:!size-4"
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
				label="Seek"
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
					<VideoPlayerIconButton
						{classes}
						{size}
						label={`Rewind ${seekStep} seconds`}
						icon={rewindIcon}
						disabled={disabled || !canSeek}
						onPress={() => player.runInteraction(() => player.seekBy(-seekStep))}
					/>
				{/if}

				{#if hasControl('play')}
					<VideoPlayerIconButton
						{classes}
						{size}
						label={player.paused || player.ended ? 'Play' : 'Pause'}
						icon={player.paused || player.ended ? playIcon : pauseIcon}
						{disabled}
						onPress={() => player.runInteraction(() => player.togglePlay())}
					/>
				{/if}

				{#if hasControl('seekForward')}
					<VideoPlayerIconButton
						{classes}
						{size}
						label={`Forward ${seekStep} seconds`}
						icon={fastForwardIcon}
						disabled={disabled || !canSeek}
						onPress={() => player.runInteraction(() => player.seekBy(seekStep))}
					/>
				{/if}
			</div>

			<div data-slot="video-player-control-end" class={classes.controlEnd({ size })}>
				<div data-slot="video-player-secondary-controls" class="contents">
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

				<div data-slot="video-player-compact-settings" class="hidden">
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
