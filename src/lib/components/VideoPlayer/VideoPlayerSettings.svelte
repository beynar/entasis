<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Slot } from '$lib/components/Slot/slot.js';
	import type { Sizes } from '$lib/types/theme.js';
	import { gearIcon } from '../Icons/gear.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { VideoPlayerTrack } from './videoPlayer.props.js';
	import { getVideoPlayerSettingsMenuItems } from './videoPlayerSettingsMenu.js';
	import {
		videoPlayerSettingsMenuOptionTheme,
		videoPlayerSettingsMenuSeparatorTheme
	} from './videoPlayer.settingsMenu.theme.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';
	import VideoPlayerIconButton from './VideoPlayerIconButton.svelte';
	import VideoPlayerSettingsVolumeFooter from './VideoPlayerSettingsVolumeFooter.svelte';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		player,
		classes,
		size,
		tracks,
		playbackRates,
		volumeStep = 0.05,
		disabled,
		includeVolume = false,
		includeRate = true,
		includeLoop = true,
		includeCaptions = true,
		includePictureInPicture = false,
		includeDownload = false,
		includeFullscreen = false,
		downloadHref = '',
		label = 'Settings',
		icon = gearIcon,
		onOverlayOpenChange
	}: {
		player: VideoPlayerState;
		classes: VideoPlayerClasses;
		size: Sizes;
		tracks: VideoPlayerTrack[];
		playbackRates: number[];
		volumeStep?: number;
		disabled: boolean;
		includeVolume?: boolean;
		includeRate?: boolean;
		includeLoop?: boolean;
		includeCaptions?: boolean;
		includePictureInPicture?: boolean;
		includeDownload?: boolean;
		includeFullscreen?: boolean;
		downloadHref?: string;
		label?: string;
		icon?: Slot;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();

	let open = $state(false);
	let lastReportedOpen = false;

	const menuItems = $derived.by(() =>
		getVideoPlayerSettingsMenuItems({
			player,
			classes,
			tracks,
			playbackRates,
			disabled,
			includeRate,
			includeLoop,
			includeCaptions,
			includePictureInPicture,
			includeDownload,
			includeFullscreen,
			downloadHref,
			runIfEnabled
		})
	);
	const hasMenuItems = $derived(menuItems.length > 0 || includeVolume);

	function runIfEnabled(action: () => void) {
		if (disabled) return;
		player.runInteraction(action);
	}

	$effect(() => {
		if (disabled) open = false;
	});
	$effect(() => {
		if (lastReportedOpen === open) return;
		lastReportedOpen = open;
		onOverlayOpenChange(open);
	});
	onDestroy(() => {
		if (lastReportedOpen) onOverlayOpenChange(false);
	});
</script>

{#snippet volumeFooter()}
	<VideoPlayerSettingsVolumeFooter {player} {classes} {size} {volumeStep} {disabled} />
{/snippet}

{#if hasMenuItems}
	<PopupMenu
		bind:open
		position="top-end"
		offset={8}
		lockScroll={false}
		closeOnClickOutside
		closeOnEscape
		mobileSheet
		class={classes.popoverPanel({ className: 'min-w-52 p-1' })}
		menu={{
			items: menuItems,
			class: classes.menu(),
			footer: includeVolume ? volumeFooter : undefined,
			theme: {
				option: videoPlayerSettingsMenuOptionTheme,
				separator: videoPlayerSettingsMenuSeparatorTheme,
				submenu: videoPlayerSettingsMenuOptionTheme
			}
		}}
	>
		{#snippet trigger(popover)}
			<VideoPlayerIconButton
				{classes}
				{size}
				{label}
				{icon}
				{disabled}
				aria-haspopup="menu"
				aria-expanded={popover.isOpen}
				onPress={() => popover.toggle()}
				{@attach popover.reference}
			/>
		{/snippet}
	</PopupMenu>
{/if}
