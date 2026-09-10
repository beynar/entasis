<script lang="ts">
	import { audioPlayerVolumeControlSliderTheme } from './audioPlayerVolumeControl.slider.theme.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import { speakerHighIcon } from '../Icons/speakerHigh.js';
	import MediaVolumeControl from '../MediaVolume/MediaVolumeControl.svelte';
	import type { AudioPlayerLayout } from './audioPlayer.props.js';
	import type { AudioPlayerState } from './audioPlayer.state.svelte.js';
	import type { useAudioPlayerTheme } from './audioPlayer.theme.js';
	import AudioPlayerIconButton from './AudioPlayerIconButton.svelte';

	type AudioPlayerClasses = ReturnType<typeof useAudioPlayerTheme>;

	let {
		player,
		classes,
		size,
		color,
		layout,
		volumeStep,
		disabled = false
	}: {
		player: AudioPlayerState;
		classes: AudioPlayerClasses;
		size: Sizes;
		color: Colors;
		layout: AudioPlayerLayout;
		volumeStep: number;
		disabled?: boolean;
	} = $props();
</script>

<MediaVolumeControl
	volume={player.volume}
	muted={player.muted}
	{size}
	{color}
	{volumeStep}
	{disabled}
	position="top"
	lowVolumeIcon={speakerHighIcon}
	class={classes.volumeControl({ layout })}
	popoverClass={classes.popoverPanel({ className: 'p-1.5 pb-2.5' })}
	panelClass={classes.volumePanel({
		size,
		className: 'w-auto justify-center gap-1.5 px-0 pt-0.5 pb-0'
	})}
	sliderClass={classes.volumeSlider({ size, className: 'h-auto' })}
	sliderTheme={audioPlayerVolumeControlSliderTheme}
	onToggleMuted={() => player.runInteraction(() => player.toggleMuted())}
	onVolumeChange={(nextVolume) => player.runInteraction(() => player.setVolume(nextVolume))}
>
	{#snippet trigger(context)}
		<AudioPlayerIconButton
			{classes}
			{size}
			{color}
			label={context.label}
			icon={context.icon}
			active={context.active}
			{disabled}
			aria-haspopup={context.ariaHaspopup}
			aria-expanded={context.ariaExpanded}
			onPress={context.activate}
			{@attach context.reference}
		/>
	{/snippet}

	{#snippet toggleButton(context)}
		<AudioPlayerIconButton
			{classes}
			{size}
			{color}
			label={context.label}
			icon={context.icon}
			active={context.active}
			pressed={context.pressed}
			{disabled}
			onPress={context.activate}
		/>
	{/snippet}
</MediaVolumeControl>
