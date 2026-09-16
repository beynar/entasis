<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
	import { pauseIcon } from '../Icons/pause.js';
	import { playIcon } from '../Icons/play.js';
	import { repeatIcon } from '../Icons/repeat.js';
	import { skipBackIcon } from '../Icons/skipBack.js';
	import { skipForwardIcon } from '../Icons/skipForward.js';
	import type {
		AudioPlayerControl,
		AudioPlayerLayout,
		AudioPlayerSource,
		AudioPlayerTimeVariant
	} from './audioPlayer.props.js';
	import type { AudioPlayerState } from './audioPlayer.state.svelte.js';
	import type { useAudioPlayerTheme } from './audioPlayer.theme.js';
	import MediaIconButton from '../MediaVolume/MediaIconButton.svelte';
	import AudioPlayerTime from './AudioPlayerTime.svelte';
	import AudioPlayerVolumeControl from './AudioPlayerVolumeControl.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type AudioPlayerClasses = ReturnType<typeof useAudioPlayerTheme>;

	let {
		player,
		classes,
		size,
		color,
		layout,
		controls,
		src,
		sources,
		download,
		timeVariant,
		seekStep,
		volumeStep,
		disabled
	}: {
		player: AudioPlayerState;
		classes: AudioPlayerClasses;
		size: Sizes;
		color: Colors;
		layout: AudioPlayerLayout;
		controls: AudioPlayerControl[];
		src?: string;
		sources: AudioPlayerSource[];
		download: boolean | string;
		timeVariant: AudioPlayerTimeVariant;
		seekStep: number;
		volumeStep: number;
		disabled: boolean;
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

	function hasControl(control: AudioPlayerControl) {
		return controlSet.has(control);
	}
</script>

<div data-slot="audio-player-controls" class={classes.controls({ size, layout })}>
	<div data-slot="audio-player-primary-controls" class={classes.controlGroup({ layout })}>
		{#if hasControl('seekBackward')}
			<MediaIconButton
				{size}
				{color}
				class={classes.controlButton({ size })}
				label={t.mediaBack(seekStep)}
				icon={skipBackIcon}
				disabled={disabled || !canSeek}
				onPress={() => player.runInteraction(() => player.seekBy(-seekStep))}
			/>
		{/if}

		{#if hasControl('play')}
			<MediaIconButton
				{size}
				{color}
				variant="solid"
				class={classes.playButton({ size })}
				label={player.paused || player.ended ? t.play : t.pause}
				icon={player.paused || player.ended ? playIcon : pauseIcon}
				{disabled}
				onPress={() => player.runInteraction(() => player.togglePlay())}
			/>
		{/if}

		{#if hasControl('seekForward')}
			<MediaIconButton
				{size}
				{color}
				class={classes.controlButton({ size })}
				label={t.mediaForward(seekStep)}
				icon={skipForwardIcon}
				disabled={disabled || !canSeek}
				onPress={() => player.runInteraction(() => player.seekBy(seekStep))}
			/>
		{/if}

		{#if hasControl('time')}
			<AudioPlayerTime
				{classes}
				{size}
				currentTime={player.currentTime}
				duration={player.duration}
				variant={timeVariant}
			/>
		{/if}
	</div>

	<div data-slot="audio-player-secondary-controls" class={classes.controlGroup({ layout })}>
		{#if hasControl('volume')}
			<AudioPlayerVolumeControl
				{player}
				{classes}
				{size}
				{color}
				{layout}
				{volumeStep}
				{disabled}
			/>
		{/if}

		{#if hasControl('loop')}
			<MediaIconButton
				{size}
				{color}
				class={classes.controlButton({ size })}
				label={player.loop ? t.disableLoop : t.loop}
				icon={repeatIcon}
				active={player.loop}
				pressed={player.loop}
				{disabled}
				onPress={() => player.runInteraction(() => player.setLoop(!player.loop))}
			/>
		{/if}

		{#if hasControl('download') && downloadHref}
			<MediaIconButton
				{size}
				{color}
				class={classes.controlButton({ size })}
				label={t.download}
				icon={downloadSimpleIcon}
				href={disabled ? undefined : downloadHref}
				download={true}
				disabled={disabled || !downloadHref}
			/>
		{/if}
	</div>
</div>
