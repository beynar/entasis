<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { Card } from '$lib/components/Card/index.js';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import ComponentGallery from './ComponentGallery.svelte';
	import MapCardPreview from './MapCardPreview.svelte';

	const spacingSamples = [
		{ label: 'p-xs', padding: 'p-xs' },
		{ label: 'p-sm', padding: 'p-sm' },
		{ label: 'p-md', padding: 'p-md' },
		{ label: 'p-lg', padding: 'p-lg' },
		{ label: 'p-xl', padding: 'p-xl' }
	] as const;
</script>

<section class="gap-layout-md grid min-w-0">
	<div class="gap-lg grid">
		<div>
			<h2 class="text-xl font-semibold">Component preview</h2>
			<p class="text-neutral/70 text-sm">
				Every sample uses ordinary Tailwind classes and existing svelai components.
			</p>
		</div>

		<Card class="w-full" variant="solid" showBorders>
			{#snippet title()}Runtime theme{/snippet}
			{#snippet description()}
				Spacing, radius, and typography update without changing component props.
			{/snippet}
			{#snippet action()}
				<Button size="small" variant="ghost">Edit</Button>
			{/snippet}
			<div class="gap-xl grid">
				<TextInput label="Workspace name" value="Design systems" />
				<div class="gap-md flex flex-wrap">
					<Button>Save changes</Button>
					<Button variant="outline">Cancel</Button>
					<Button variant="soft" color="success">Published</Button>
				</div>
			</div>
		</Card>
	</div>

	<MapCardPreview />

	<div class="gap-lg grid">
		<h2 class="text-xl font-semibold">Spacing and radius</h2>
		<div class="gap-xl grid sm:grid-cols-2 xl:grid-cols-5">
			{#each spacingSamples as sample (sample.label)}
				<div class="raised-md gap-lg bg-surface-raised p-xl grid rounded-lg">
					<div class="bg-primary/15 rounded-md {sample.padding}">
						<div class="bg-primary h-control-md rounded-sm"></div>
					</div>
					<div>
						<strong class="text-sm">{sample.label}</strong>
						<p class="text-neutral/70 text-xs">Uses the active spacing multiplier.</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="gap-lg grid">
		<h2 class="text-xl font-semibold">Typography</h2>
		<div class="border-neutral-muted gap-lg bg-surface p-layout-sm grid rounded-lg border">
			<p class="text-xs">Extra small interface text</p>
			<p class="text-sm">Small supporting text</p>
			<p class="text-base">Base body text</p>
			<p class="text-lg">Large body text</p>
			<p class="text-xl font-medium">Section heading</p>
			<p class="text-2xl font-semibold">Page heading</p>
			<p class="text-3xl font-semibold">Display heading</p>
		</div>
	</div>

	<ComponentGallery />
</section>
