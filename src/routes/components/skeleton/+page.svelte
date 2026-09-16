<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Skeleton from '$lib/components/Skeleton/Skeleton.svelte';

	const controls = createComponentControls([
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'success', 'warning', 'danger']
		},
		{
			name: 'shape',
			type: 'segmented',
			label: 'Shape',
			value: 'line',
			options: ['line', 'block', 'avatar']
		}
	]);

	const skeletonClass = $derived.by(() => {
		switch (controls.value.shape) {
			case 'block':
				return 'h-24 w-full max-w-xs';
			case 'avatar':
				return 'size-16 rounded-full';
			default:
				return 'h-4 w-full max-w-xs';
		}
	});
</script>

<DocPage
	title="Skeleton"
	subtitle="Placeholder shapes shown while content loads."
	component="Skeleton"
	features={[
		'animate-pulse loading placeholder',
		'color tokens for tinted fills',
		'Shape via class overrides'
	]}
>
	<ComponentCard
		{controls}
		description="A single line placeholder while content loads."
		code={`<Skeleton color="${controls.value.color}" class="${skeletonClass}" />`}
	>
		<Skeleton color={controls.value.color} class={skeletonClass} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Default skeleton with a subtle neutral fill." class="!min-h-fit">
			<Skeleton />
		</ComponentCard>

		<ComponentCard
			description="Semantic color variants for different content types."
			class="!min-h-fit"
		>
			<div class="space-y-2">
				<Skeleton color="primary" class="h-4 w-full" />
				<Skeleton color="secondary" class="h-4 w-full" />
				<Skeleton color="danger" class="h-4 w-full" />
				<Skeleton color="success" class="h-4 w-full" />
				<Skeleton color="warning" class="h-4 w-full" />
				<Skeleton color="info" class="h-4 w-full" />
				<Skeleton color="neutral" class="h-4 w-full" />
				<Skeleton color="neutral" class="h-4 w-full" />
			</div>
		</ComponentCard>

		<ComponentCard description="Custom height and width via class." class="!min-h-fit">
			<Skeleton class="h-12 w-full" />
		</ComponentCard>

		<ComponentCard description="Stacked lines mimicking paragraph text." class="!min-h-fit">
			<div class="space-y-2">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-4 w-5/6" />
				<Skeleton class="h-4 w-4/6" />
			</div>
		</ComponentCard>

		<ComponentCard description="Circular skeleton for avatar placeholders." class="!min-h-fit">
			<Skeleton class="h-12 w-12 rounded-full" />
		</ComponentCard>

		<ComponentCard description="Card layout with image and text lines." class="!min-h-fit">
			<div class="space-y-4">
				<Skeleton class="h-48 w-full rounded-lg" />
				<div class="space-y-2">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-3/4" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Table row with avatar, content, and action columns."
			class="!min-h-fit"
		>
			<div class="flex gap-4">
				<Skeleton class="h-10 w-10 rounded" />
				<Skeleton class="h-10 flex-1" />
				<Skeleton class="h-10 w-24" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Repeated skeleton blocks for list loading states."
			class="!min-h-fit"
		>
			<div class="space-y-4">
				{#each { length: 3 }, index (index)}
					<Skeleton class="h-20 w-full" />
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
