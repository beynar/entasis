<script lang="ts">
	import Code from '$lib/components/Code/Code.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const elevations = ['raised-none', 'raised-sm', 'raised', 'raised-lg'] as const;
	const controls = createComponentControls([
		{
			name: 'elevation',
			type: 'segmented',
			label: 'Elevation',
			value: 'raised',
			options: elevations
		}
	]);

	const usageCode = `<div class="raised rounded-lg bg-surface p-4">
	Content
</div>`;

	const scaleCode = `<div class="raised-sm">Small elevation</div>
<div class="raised">Default elevation</div>
<div class="raised-lg">Large elevation</div>
<div class="raised-none">No elevation</div>`;

	const configCode = `<Theme designTokens={{
	light: { raisedWithBorder: true },
	dark: { raisedWithBorder: false }
}}>
	{#snippet children()}
		<!-- app -->
	{/snippet}
</Theme>`;

	const utilityRows = [
		['raised', 'Applies the default theme shadow and optional raised border.'],
		['raised-sm | raised-md | raised-lg', 'Uses the matching Tailwind shadow scale.'],
		['raised-xl | raised-2xl', 'Applies stronger elevation for prominent surfaces.'],
		['raised-none', 'Removes the raised shadow and border.'],
		['raisedWithBorder', 'Runtime design token that controls the border.']
	];
</script>

{#snippet ic(text: string)}
	<code class="bg-neutral-muted rounded px-1 py-0.5 text-sm">{text}</code>
{/snippet}

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">Raised</h1>
		<p class="text-neutral/60 text-balance">
			Tailwind utilities for giving surfaces theme-aware elevation.
		</p>
	</header>

	<ComponentCard
		{controls}
		description="Use raised on cards, popovers, and floating surfaces that need depth."
		code={`<div class="${controls.value.elevation} rounded-lg bg-surface p-4">
	Content
</div>`}
		class="!min-h-[240px]"
	>
		<div class="{controls.value.elevation} bg-surface rounded-lg p-4 text-sm">Content</div>
	</ComponentCard>

	<Separator class="my-2" children="Usage" />

	<p class="text-neutral/60">
		Use {@render ic('raised')} on a surface. The utility maps to the Tailwind shadow scale and uses theme
		variables for borders in light and dark modes.
	</p>
	<Code language="html" code={usageCode} />

	<div class="border-neutral-muted overflow-hidden rounded-xl border">
		{#each utilityRows as [name, description], index (name)}
			<div
				class="grid gap-2 p-3 md:grid-cols-[14rem_1fr] {index % 2 === 0
					? 'bg-surface'
					: 'bg-surface-canvas'}"
			>
				<code class="text-primary text-sm font-medium">{name}</code>
				<p class="text-neutral/60 text-sm">{description}</p>
			</div>
		{/each}
	</div>

	<Separator class="my-2" children="Examples" />

	<ComponentCard
		description="The suffix follows Tailwind's box-shadow scale."
		code={scaleCode}
		class="!min-h-[280px]"
	>
		<div class="grid w-full gap-3 text-sm sm:grid-cols-2">
			<div class="raised-sm bg-surface rounded-lg p-4">raised-sm</div>
			<div class="raised bg-surface rounded-lg p-4">raised</div>
			<div class="raised-lg bg-surface rounded-lg p-4">raised-lg</div>
			<div class="raised-none bg-surface rounded-lg p-4">raised-none</div>
		</div>
	</ComponentCard>

	<Separator class="my-2" children="Runtime token" />

	<p class="text-neutral/60">
		Set {@render ic('raisedWithBorder')} per theme through {@render ic('Theme.designTokens')}. The
		value can change at runtime without rebuilding Tailwind.
	</p>
	<Code language="svelte" code={configCode} />
</article>
