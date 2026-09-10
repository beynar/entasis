<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import { closedCaptioningIcon } from '../Icons/closedCaptioning.js';
	import { cornersInIcon } from '../Icons/cornersIn.js';
	import { cornersOutIcon } from '../Icons/cornersOut.js';
	import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
	import { pictureInPictureIcon } from '../Icons/pictureInPicture.js';
	import { repeatIcon } from '../Icons/repeat.js';
	import { speedometerIcon } from '../Icons/speedometer.js';
	import { subtitlesSlashIcon } from '../Icons/subtitlesSlash.js';
	import type {
		VideoPlayerControl,
		VideoPlayerSource,
		VideoPlayerTrack
	} from './videoPlayer.props.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';
	import VideoPlayerIconButton from './VideoPlayerIconButton.svelte';
	import VideoPlayerSettings from './VideoPlayerSettings.svelte';
	import VideoPlayerVolumeControl from './VideoPlayerVolumeControl.svelte';

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
		volumeStep,
		disabled,
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
		volumeStep: number;
		disabled: boolean;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();

	const controlSet = $derived(new Set(controls));
	const hasCaptionTracks = $derived(
		tracks.some((track) => {
			const kind = track.kind ?? 'subtitles';
			return kind === 'captions' || kind === 'subtitles';
		})
	);
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

{#if hasControl('volume')}
	<VideoPlayerVolumeControl
		{player}
		{classes}
		{size}
		{disabled}
		{volumeStep}
		{onOverlayOpenChange}
	/>
{/if}

{#if hasControl('rate')}
	<VideoPlayerSettings
		{player}
		{classes}
		{size}
		{tracks}
		{playbackRates}
		{disabled}
		includeRate
		includeLoop={false}
		includeCaptions={false}
		label={`Speed ${player.playbackRate}x`}
		icon={speedometerIcon}
		{onOverlayOpenChange}
	/>
{/if}

{#if hasControl('loop')}
	<VideoPlayerIconButton
		{classes}
		{size}
		label={player.loop ? 'Disable loop' : 'Enable loop'}
		icon={repeatIcon}
		active={player.loop}
		pressed={player.loop}
		{disabled}
		onPress={() => player.runInteraction(() => player.setLoop(!player.loop))}
	/>
{/if}

{#if hasControl('captions')}
	<VideoPlayerIconButton
		{classes}
		{size}
		label={player.captionsEnabled ? 'Disable captions' : 'Enable captions'}
		icon={player.captionsEnabled ? closedCaptioningIcon : subtitlesSlashIcon}
		active={player.captionsEnabled}
		pressed={player.captionsEnabled}
		disabled={disabled || !hasCaptionTracks}
		onPress={() => player.runInteraction(() => player.setCaptionsEnabled(!player.captionsEnabled))}
	/>
{/if}

{#if hasControl('settings')}
	<VideoPlayerSettings
		{player}
		{classes}
		{size}
		{tracks}
		{playbackRates}
		{disabled}
		includeRate={!hasControl('rate')}
		includeLoop={!hasControl('loop')}
		includeCaptions={!hasControl('captions')}
		{onOverlayOpenChange}
	/>
{/if}

{#if hasControl('pictureInPicture')}
	<VideoPlayerIconButton
		{classes}
		{size}
		label={player.actualPictureInPicture ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
		icon={pictureInPictureIcon}
		active={player.actualPictureInPicture}
		pressed={player.actualPictureInPicture}
		disabled={disabled || !player.supportsPictureInPicture}
		class="max-[360px]:hidden"
		onPress={() => player.runInteraction(() => player.togglePictureInPicture())}
	/>
{/if}

{#if hasControl('download') && downloadHref}
	<VideoPlayerIconButton
		{classes}
		{size}
		label="Download"
		icon={downloadSimpleIcon}
		disabled={disabled || !downloadHref}
		href={disabled ? undefined : downloadHref}
		download={true}
		class="max-[360px]:hidden"
	/>
{/if}

{#if hasControl('fullscreen')}
	<VideoPlayerIconButton
		{classes}
		{size}
		label={player.actualFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
		icon={player.actualFullscreen ? cornersInIcon : cornersOutIcon}
		active={player.actualFullscreen}
		pressed={player.actualFullscreen}
		disabled={disabled || !player.supportsFullscreen}
		onPress={() => player.runInteraction(() => player.toggleFullscreen())}
	/>
{/if}
