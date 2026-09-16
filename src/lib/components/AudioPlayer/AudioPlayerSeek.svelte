<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Snippet } from 'svelte';
	import type { AudioPlayerVariant, AudioPlayerWaveformVariant } from './audioPlayer.props.js';
	import type { AudioPlayerState } from './audioPlayer.state.svelte.js';
	import type { useAudioPlayerTheme } from './audioPlayer.theme.js';
	import AudioPlayerTrack from './AudioPlayerTrack.svelte';
	import AudioPlayerWaveform from './AudioPlayerWaveform.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type AudioPlayerClasses = ReturnType<typeof useAudioPlayerTheme>;

	let {
		player,
		classes,
		size,
		color,
		variant,
		waveformVariant,
		waveformSamples,
		disabled = false,
		title,
		seek
	}: {
		player: AudioPlayerState;
		classes: AudioPlayerClasses;
		size: Sizes;
		color: Colors;
		variant: AudioPlayerVariant;
		waveformVariant: AudioPlayerWaveformVariant;
		waveformSamples: number[];
		disabled?: boolean;
		title: string;
		seek?: Snippet<[AudioPlayerState]>;
	} = $props();
	const t = $derived(useI18n());
</script>

{#if seek}
	{@render seek(player)}
{:else if variant === 'track'}
	<AudioPlayerTrack
		{classes}
		{size}
		{color}
		currentTime={player.currentTime}
		duration={player.duration}
		buffered={player.buffered}
		{disabled}
		label={t.seekTitle(title)}
		onSeek={(time) => player.runInteraction(() => player.seekTo(time))}
	/>
{:else}
	<AudioPlayerWaveform
		{classes}
		{size}
		{color}
		variant={waveformVariant}
		samples={waveformSamples}
		currentTime={player.currentTime}
		duration={player.duration}
		buffered={player.buffered}
		{disabled}
		label={t.seekTitle(title)}
		onSeek={(time) => player.runInteraction(() => player.seekTo(time))}
	/>
{/if}
