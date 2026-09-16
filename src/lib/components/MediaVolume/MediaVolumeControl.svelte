<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Slider from '../Form/Slider/Slider.svelte';
	import MediaIconButton from './MediaIconButton.svelte';
	import { speakerHighIcon } from '../Icons/speakerHigh.js';
	import { speakerLowIcon } from '../Icons/speakerLow.js';
	import { speakerSlashIcon } from '../Icons/speakerSlash.js';
	import Popover from '../Popover/Popover.svelte';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import { isMediaEffectivelyMuted } from './mediaVolume.js';
	import type {
		MediaVolumeControlButtonPayload,
		MediaVolumeControlProps,
		MediaVolumeControlTriggerPayload
	} from './mediaVolumeControl.props.js';
	import { useMediaVolumeControlTheme } from './mediaVolumeControl.theme.js';
	import { getMediaVolumeControlSliderTheme } from './mediaVolumeControl.slider.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		volume,
		muted,
		onVolumeChange,
		onToggleMuted,
		mode = 'popover',
		volumeStep = 0.05,
		disabled = false,
		size = 'normal',
		color,
		orientation,
		defaultOpen = false,
		open = $bindable(),
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		position = 'bottom',
		offset = 8,
		popover,
		mobileSheet = true,
		unmuteOnTrigger = true,
		label,
		mutedIcon = speakerSlashIcon,
		lowVolumeIcon = speakerLowIcon,
		highVolumeIcon = speakerHighIcon,
		lowVolumeThreshold = 0.5,
		class: className,
		buttonClass,
		buttonColor,
		panelClass,
		sliderClass,
		sliderTheme,
		trigger: triggerSnippet,
		toggleButton: toggleButtonSnippet,
		theme
	}: MediaVolumeControlProps = $props();
	const t = $derived(useI18n());
	const resolvedLabel = $derived(label ?? t.volume);
	const openState = createBindableValue(
		() => open,
		(nextOpen) => (open = nextOpen),
		() => defaultOpen
	);

	const classes = $derived(useMediaVolumeControlTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const resolvedOrientation = $derived(
		orientation ?? (mode === 'popover' ? 'vertical' : 'horizontal')
	);
	const isEffectivelyMuted = $derived(isMediaEffectivelyMuted({ volume, muted }));
	const volumePercentage = $derived(isEffectivelyMuted ? 0 : volume * 100);
	const roundedVolume = $derived(Math.round(volume * 100));
	const triggerLabel = $derived(
		isEffectivelyMuted ? t.unmute : `${resolvedLabel} ${roundedVolume}%`
	);
	const toggleLabel = $derived(isEffectivelyMuted ? t.unmute : t.mute);
	const volumeIcon = $derived(
		isEffectivelyMuted ? mutedIcon : volume < lowVolumeThreshold ? lowVolumeIcon : highVolumeIcon
	);
	const defaultSliderTheme = $derived(getMediaVolumeControlSliderTheme(resolvedOrientation));
	$effect(() => {
		if (disabled && openState.value) setOpen(false);
	});

	function setOpen(nextOpen: boolean) {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}

	function handleSliderChange(nextValue: number | number[] | null) {
		if (nextValue === null) return;
		const nextVolume = Array.isArray(nextValue) ? (nextValue[0] ?? 0) : nextValue;
		onVolumeChange(nextVolume / 100);
	}

	function handleTriggerClick(popover: PopoverState) {
		if (unmuteOnTrigger && isEffectivelyMuted) {
			onToggleMuted();
			popover.open();
			return;
		}

		popover.toggle();
	}

	function getTogglePayload(): MediaVolumeControlButtonPayload {
		return {
			label: toggleLabel,
			icon: volumeIcon,
			active: isEffectivelyMuted,
			pressed: isEffectivelyMuted,
			disabled,
			activate: onToggleMuted
		};
	}

	function getTriggerPayload(popover: PopoverState): MediaVolumeControlTriggerPayload {
		return {
			...getTogglePayload(),
			label: triggerLabel,
			isOpen: popover.isOpen,
			reference: popover.reference,
			haspopup: 'dialog',
			expanded: popover.isOpen,
			activate: () => handleTriggerClick(popover)
		};
	}
</script>

{#snippet defaultTrigger(context: MediaVolumeControlTriggerPayload)}
	<MediaIconButton
		{size}
		class={buttonClass}
		color={buttonColor ?? resolvedColor}
		label={context.label}
		icon={context.icon}
		active={context.active}
		pressed={context.pressed}
		disabled={context.disabled}
		haspopup={context.haspopup}
		expanded={context.expanded}
		onPress={context.activate}
		{@attach context.reference}
	/>
{/snippet}

{#snippet defaultToggleButton(context: MediaVolumeControlButtonPayload)}
	<MediaIconButton
		{size}
		class={buttonClass}
		color={buttonColor ?? resolvedColor}
		label={context.label}
		icon={context.icon}
		active={context.active}
		pressed={context.pressed}
		disabled={context.disabled}
		onPress={context.activate}
	/>
{/snippet}

{#snippet panel()}
	<div
		data-slot="media-volume-panel"
		class={classes.panel({ orientation: resolvedOrientation, className: panelClass })}
	>
		{#if toggleButtonSnippet}
			{@render toggleButtonSnippet(getTogglePayload())}
		{:else}
			{@render defaultToggleButton(getTogglePayload())}
		{/if}

		<div
			data-slot="media-volume-slider"
			class={classes.slider({ orientation: resolvedOrientation, className: sliderClass })}
		>
			<Slider
				label={resolvedLabel}
				value={volumePercentage}
				min={0}
				max={100}
				step={Math.max(1, volumeStep * 100)}
				orientation={resolvedOrientation}
				{disabled}
				showValue
				formatValue={(nextValue) => `${Math.round(nextValue)}%`}
				thumbLabels={[resolvedLabel]}
				color={resolvedColor}
				variant="thick"
				{size}
				theme={sliderTheme ?? defaultSliderTheme}
				onValueChange={handleSliderChange}
			/>
		</div>
	</div>
{/snippet}

<div data-slot="media-volume-control" class={classes.root({ mode, className })}>
	{#if mode === 'popover'}
		<Popover
			open={openState.value}
			onOpenChange={setOpen}
			{onAfterOpen}
			{onAfterClose}
			{position}
			{offset}
			size={popover?.size}
			lockScroll={false}
			closeOnClickOutside
			closeOnEscape
			{mobileSheet}
			class={classes.popoverPanel({ className: popover?.class })}
		>
			{#snippet trigger(anchor)}
				{#if triggerSnippet}
					{@render triggerSnippet(getTriggerPayload(anchor))}
				{:else}
					{@render defaultTrigger(getTriggerPayload(anchor))}
				{/if}
			{/snippet}

			{@render panel()}
		</Popover>
	{:else}
		{@render panel()}
	{/if}
</div>
