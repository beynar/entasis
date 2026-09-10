<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import { spinnerOverlay } from '$lib/attachments/spinnerOverlay.svelte.js';
	import Button from '$lib/components/Button/Button.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import type { SpinnerVariant } from '$lib/components/Spinner/spinner.props.js';

	const spinnerVariants = ['default', 'grid', 'pulse', 'puff', 'lines', 'circles'] as const satisfies readonly SpinnerVariant[];
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
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: spinnerVariants
		},
		{ name: 'loading', type: 'switch', label: 'Loading', value: true }
	]);

	let loadingText = $state('Loading...');
	let isLoading = $state(true);
	let show = $state(true);
</script>

<DocPage
	title="Loader"
	subtitle="Overlay a spinner on any element while async work runs."
	features={[
		'Svelte {@attach} on any element',
		'Fade in/out overlay animation',
		'Theme default and per-instance Spinner variants',
		'Animated loading text updates',
		'Auto-positions parent relatively'
	]}
>
	<ComponentCard
		{controls}
		description="Overlay a spinner on an element while async work runs. The animation follows Theme."
		code={`<div
	{@attach spinnerOverlay({
		loading: ${controls.value.loading},
		text: 'Loading...',
		size: '${controls.value.size}',
		color: '${controls.value.color}',
		variant: '${controls.value.variant}'
	})}
>
	<Button fullWidth>Submit</Button>
</div>`}
		class="raised bg-amber-100 p-2"
	>
		<div
			class="w-full"
			{@attach spinnerOverlay({
				loading: controls.value.loading,
				text: loadingText,
				size: controls.value.size,
				color: controls.value.color,
				variant: controls.value.variant
			})}
		>
			<Button fullWidth>Submit caca</Button>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Toggle loading state and text interactively."
			class="raised bg-amber-100 p-2"
		>
			<div class="flex w-full flex-col gap-4">
				<input placeholder="Loading text" bind:value={loadingText} />
				<input type="checkbox" bind:checked={isLoading} />
				<label for="isLoading"></label>

				{#if show}
					<div
						class="w-full"
						{@attach spinnerOverlay({
							loading: isLoading,
							text: loadingText
						})}
					>
						<Button fullWidth>Submit caca</Button>
					</div>
				{/if}

				<Button fullWidth onclick={() => (show = !show)}>Show loader</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
