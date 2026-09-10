<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import ToggleButton from '$lib/components/ToggleButton/ToggleButton.svelte';
	import { eyeClosedIcon } from '$lib/components/Icons/eyeClosed.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const variants = ['ghost', 'outline'] as const;
	let formSubmissions = $state(0);
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ghost',
			options: variants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Toggle button"
	subtitle="A button that toggles between pressed and unpressed states."
	component="ToggleButton"
	features={[
		'Bindable value state',
		'Ghost and outline variants (Button subset)',
		'Resting outline matches Button',
		'Auto square layout for icon-only',
		'data-checked reflects pressed state',
		'Prefix, suffix & children slots'
	]}
>
	<ComponentCard
		{controls}
		code={`<ToggleButton type="button" size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" disabled={${controls.value.disabled}}>Toggle me</ToggleButton>`}
	>
		<ToggleButton
			type="button"
			size={controls.value.size}
			variant={controls.value.variant}
			color={controls.value.color}
			disabled={controls.value.disabled}
		>
			Toggle me
		</ToggleButton>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Every variant and semantic color. Each pair shows the resting and pressed states."
		>
			<div class="grid w-full gap-6">
				{#each variants as variant (variant)}
					<div class="grid gap-3">
						<p class="text-neutral/60 text-sm font-medium capitalize">{variant}</p>
						<div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
							{#each colors as color (color)}
								<div class="flex min-w-0 items-center justify-between gap-2">
									<span class="text-neutral/70 truncate text-sm capitalize">{color}</span>
									<div class="flex shrink-0 gap-1.5">
										<ToggleButton
											{variant}
											{color}
											prefix={eyeClosedIcon}
											ariaLabel={`${color} off`}
										/>
										<ToggleButton
											{variant}
											{color}
											prefix={eyeClosedIcon}
											ariaLabel={`${color} on`}
											value
										/>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Three sizes to match surrounding density.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				{#each sizes as size (size)}
					<ToggleButton {size} color="neutral" prefix={eyeClosedIcon}>{size}</ToggleButton>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="With only an icon and no label, the toggle renders squared.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				<ToggleButton prefix={eyeClosedIcon} ariaLabel="Visibility off" />
				<ToggleButton prefix={eyeClosedIcon} ariaLabel="Visibility on" value />
			</div>
		</ComponentCard>

		<ComponentCard
			description="The native type defaults to button, so toggling inside a form never submits it."
			code={`<form onsubmit={handleSubmit}>
\t<ToggleButton>Formatting</ToggleButton>
</form>`}
		>
			<form
				class="flex items-center gap-3"
				onsubmit={(event) => {
					event.preventDefault();
					formSubmissions += 1;
				}}
			>
				<ToggleButton>Formatting</ToggleButton>
				<span class="text-neutral/60 text-sm">Submissions: {formSubmissions}</span>
			</form>
		</ComponentCard>

		<ComponentCard description="Disabled toggles are dimmed and ignore interaction.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				<ToggleButton disabled>Off</ToggleButton>
				<ToggleButton disabled value>On</ToggleButton>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
