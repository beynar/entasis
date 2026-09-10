<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { MediaVolumeControl } from '$lib/components/MediaVolume/index.js';
	import type { SliderProps } from '$lib/components/Form/Slider/slider.props.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { colors, sizes } from '$lib/utils/tokens.js';

	type VolumeState = {
		volume: number;
		muted: boolean;
		lastAudibleVolume: number;
	};

	let defaultVolume = $state<VolumeState>({
		volume: 0.72,
		muted: false,
		lastAudibleVolume: 0.72
	});
	const volumeModes = ['popover', 'inline'] as const;
	const volumeOrientations = ['horizontal', 'vertical'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: colors
		},
		{
			name: 'mode',
			type: 'segmented',
			label: 'Mode',
			value: 'popover',
			options: volumeModes
		},
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'vertical',
			options: volumeOrientations
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
	let inlineVolume = $state<VolumeState>({
		volume: 0.4,
		muted: false,
		lastAudibleVolume: 0.4
	});
	let playerVolume = $state<VolumeState>({
		volume: 1,
		muted: false,
		lastAudibleVolume: 1
	});

	const inlineCode = `<MediaVolumeControl
	mode="inline"
	{volume}
	{muted}
	onVolumeChange={setVolume}
	onToggleMuted={toggleMuted}
/>`;

	const customCode = `<MediaVolumeControl
	{volume}
	{muted}
	orientation="vertical"
	popoverClass="border-white/10 bg-black/90 text-white"
	panelClass="w-auto flex-col gap-2 px-0 py-1"
	sliderTheme={darkSliderTheme}
	onVolumeChange={setVolume}
	onToggleMuted={toggleMuted}
>
	{#snippet trigger(context)}
		<Button
			squared
			variant="ghost"
			color="neutral"
			label={context.label}
			prefix={context.icon}
			onclick={context.activate}
			aria-haspopup={context.ariaHaspopup}
			aria-expanded={context.ariaExpanded}
			{@attach context.reference}
		/>
	{/snippet}
</MediaVolumeControl>`;

	const darkSliderTheme = {
		root: {
			base: 'w-auto justify-items-center gap-0'
		},
		header: {
			base: 'sr-only'
		},
		label: {
			base: 'sr-only'
		},
		inputContainer: {
			base: 'w-auto gap-0 text-white'
		},
		control: {
			base: 'w-auto flex-col items-center gap-2'
		},
		track: {
			base: 'h-36 text-primary focus-visible:ring-white/60 focus-visible:ring-offset-0'
		},
		trackBackground: {
			base: 'bg-white/25'
		},
		range: {
			base: 'bg-primary'
		},
		valueLabels: {
			base: 'mt-1 ml-0'
		},
		valueLabel: {
			base: 'min-w-14 border-white/10 bg-white/10 text-center text-white/90'
		}
	} satisfies SliderProps['theme'];

	function setVolume(state: VolumeState, nextVolume: number) {
		state.volume = nextVolume;
		if (nextVolume > 0) {
			state.muted = false;
			state.lastAudibleVolume = nextVolume;
		}
	}

	function toggleMuted(state: VolumeState) {
		if (state.muted || state.volume === 0) {
			state.muted = false;
			state.volume = state.lastAudibleVolume || 0.05;
			return;
		}

		state.lastAudibleVolume = state.volume;
		state.muted = true;
	}
</script>

<DocPage
	title="Media volume"
	subtitle="Shared volume control primitive for media players. It owns the trigger, popover or inline panel, mute button, slider, value chip, and effective-muted state."
	component="MediaVolumeControl"
	features={[
		'Popover and inline modes from one component',
		'Effective mute handling for muted or zero-volume media',
		'Horizontal and vertical slider layouts',
		'Custom trigger and mute button snippets for player chrome',
		'Shared by AudioPlayer and VideoPlayer'
	]}
>
	<ComponentCard
		{controls}
		description="Default popover control with a vertical slider and stable value chip."
		class="!min-h-fit"
		code={`<MediaVolumeControl
	{volume}
	{muted}
	size="${controls.value.size}"
	color="${controls.value.color}"
	mode="${controls.value.mode}"
	orientation="${controls.value.orientation}"
	disabled={${controls.value.disabled}}
	onVolumeChange={setVolume}
	onToggleMuted={toggleMuted}
/>`}
	>
		<div class="flex min-h-80 items-start justify-center pt-6">
			<MediaVolumeControl
				volume={defaultVolume.volume}
				muted={defaultVolume.muted}
				size={controls.value.size}
				color={controls.value.color}
				mode={controls.value.mode}
				orientation={controls.value.orientation}
				disabled={controls.value.disabled}
				onVolumeChange={(nextVolume) => setVolume(defaultVolume, nextVolume)}
				onToggleMuted={() => toggleMuted(defaultVolume)}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Inline mode renders the same mute button and slider without a popover surface."
			class="!min-h-fit"
			code={inlineCode}
		>
			<div class="w-full max-w-md">
				<MediaVolumeControl
					mode="inline"
					volume={inlineVolume.volume}
					muted={inlineVolume.muted}
					onVolumeChange={(nextVolume) => setVolume(inlineVolume, nextVolume)}
					onToggleMuted={() => toggleMuted(inlineVolume)}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Player chrome can provide custom trigger and mute buttons while the primitive keeps the popover and slider behavior."
			class="!min-h-fit bg-black"
			code={customCode}
		>
			<div class="rounded-lg bg-black p-4 text-white">
				<MediaVolumeControl
					volume={playerVolume.volume}
					muted={playerVolume.muted}
					orientation="vertical"
					color="primary"
					popoverClass="border-white/10 bg-black/90 p-1.5 text-white shadow-xl backdrop-blur"
					panelClass="w-auto flex-col justify-center gap-1.5 px-0 py-0.5"
					sliderTheme={darkSliderTheme}
					onVolumeChange={(nextVolume) => setVolume(playerVolume, nextVolume)}
					onToggleMuted={() => toggleMuted(playerVolume)}
				>
					{#snippet trigger(context)}
						<Button
							squared
							variant="ghost"
							color="neutral"
							size="normal"
							label={context.label}
							prefix={context.icon}
							data-active={context.active ? 'true' : undefined}
							aria-haspopup={context.ariaHaspopup}
							aria-expanded={context.ariaExpanded}
							onclick={context.activate}
							class="border border-white/10 bg-white/5 text-white hover:bg-white/10"
							{@attach context.reference}
						/>
					{/snippet}

					{#snippet toggleButton(context)}
						<Button
							squared
							variant="ghost"
							color="neutral"
							size="normal"
							label={context.label}
							prefix={context.icon}
							data-active={context.active ? 'true' : undefined}
							aria-pressed={context.pressed}
							onclick={context.activate}
							class="border border-white/10 bg-white/5 text-white hover:bg-white/10"
						/>
					{/snippet}
				</MediaVolumeControl>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
