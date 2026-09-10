<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import MediaVolumeControl from '../MediaVolume/MediaVolumeControl.svelte';
	import { getVideoPlayerSliderTheme } from './videoPlayer.slider.theme.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';
	import VideoPlayerIconButton from './VideoPlayerIconButton.svelte';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		player,
		classes,
		size,
		disabled,
		volumeStep,
		onOverlayOpenChange
	}: {
		player: VideoPlayerState;
		classes: VideoPlayerClasses;
		size: Sizes;
		disabled: boolean;
		volumeStep: number;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();

	const sliderTheme = getVideoPlayerSliderTheme('vertical');
</script>

<MediaVolumeControl
	volume={player.volume}
	muted={player.muted}
	{size}
	{volumeStep}
	{disabled}
	color="primary"
	orientation="vertical"
	position="top"
	popoverClass={classes.popoverPanel({ className: 'p-1.5' })}
	panelClass={classes.volumePanel({
		className: 'w-auto flex-col justify-center gap-1.5 px-0 py-0.5'
	})}
	sliderClass={classes.slider({ size, disabled })}
	{sliderTheme}
	onOpenChange={onOverlayOpenChange}
	onToggleMuted={() => player.runInteraction(() => player.toggleMuted())}
	onVolumeChange={(nextVolume) => player.runInteraction(() => player.setVolume(nextVolume))}
>
	{#snippet trigger(context)}
		<VideoPlayerIconButton
			{classes}
			{size}
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
		<VideoPlayerIconButton
			{classes}
			{size}
			label={context.label}
			icon={context.icon}
			active={context.active}
			pressed={context.pressed}
			{disabled}
			onPress={context.activate}
		/>
	{/snippet}
</MediaVolumeControl>
