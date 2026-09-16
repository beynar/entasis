<script lang="ts">
	import Heading from '$lib/components/Heading/Heading.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
	const weights = ['light', 'normal', 'bold'] as const;
	const aligns = ['left', 'center', 'right'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'h1',
			options: sizes
		},
		{
			name: 'weight',
			type: 'segmented',
			label: 'Weight',
			value: 'normal',
			options: weights
		},
		{
			name: 'align',
			type: 'segmented',
			label: 'Align',
			value: 'left',
			options: aligns
		},
		{ name: 'muted', type: 'switch', label: 'Muted', value: false },
		{ name: 'underline', type: 'switch', label: 'Underline', value: false },
		{ name: 'balanced', type: 'switch', label: 'Balanced', value: false }
	]);
</script>

<DocPage
	title="Heading"
	subtitle="Semantic, styled headings with size, weight, alignment, and cap-trim controls."
	component="Heading"
	features={[
		'Renders semantic h1–h6 elements',
		'Decouple visual size from semantic level via as',
		'Balanced line breaks and cap trimming',
		'weight, align, underline, and muted variants'
	]}
>
	<ComponentCard
		{controls}
		code={`<Heading
	size="${controls.value.size}"
	weight="${controls.value.weight}"
	align="${controls.value.align}"
	muted={${controls.value.muted}}
	underline={${controls.value.underline}}
	balanced={${controls.value.balanced}}
>
	The quick brown fox
</Heading>`}
	>
		<Heading
			size={controls.value.size}
			weight={controls.value.weight}
			align={controls.value.align}
			muted={controls.value.muted}
			underline={controls.value.underline}
			balanced={controls.value.balanced}
			class="w-full"
		>
			The quick brown fox
		</Heading>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Every visual size (h1–h6).">
			<div class="flex w-full flex-col gap-3">
				{#each sizes as size, index (index)}
					<Heading {size}>{size} — The quick brown fox</Heading>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Font weights.">
			<div class="flex w-full flex-col gap-3">
				{#each weights as weight, index (index)}
					<Heading size="h3" {weight}>{weight} weight</Heading>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Alignment.">
			<div class="flex w-full flex-col gap-3">
				{#each aligns as align, index (index)}
					<Heading size="h3" {align} class="w-full">{align} aligned</Heading>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Underline and muted modifiers.">
			<div class="flex w-full flex-col gap-3">
				<Heading size="h3" underline>Underlined heading</Heading>
				<Heading size="h3" muted>Muted heading</Heading>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Visual size decoupled from semantic level: an h1-sized element rendered as an h3."
		>
			<Heading size="h1" as="h3">Looks like h1, is an h3</Heading>
		</ComponentCard>
	{/snippet}
</DocPage>
