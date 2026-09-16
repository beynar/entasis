<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import { AspectRatio } from '$lib/components/AspectRatio/index.js';
	import type { AspectRatioRatio } from '$lib/components/AspectRatio/aspectRatio.props.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const aspectRatios = ['16x9', '4x3', '1x1', '3x2', '2x1', '2x3', '3x4', '9x16', '1x2'] as const;
	const controls = createComponentControls([
		{
			name: 'ratio',
			type: 'segmented',
			label: 'Ratio',
			value: '16x9',
			options: aspectRatios
		}
	]);

	const ratios = [
		{ ratio: '2x1', label: 'Wide' },
		{ ratio: '2x3', label: 'Portrait' },
		{ ratio: '16x9', label: 'Video' },
		{ ratio: '4x3', label: 'Standard' },
		{ ratio: '1x1', label: 'Square' },
		{ ratio: '3x4', label: 'Portrait' },
		{ ratio: '3x2', label: 'Photo' },
		{ ratio: '9x16', label: 'Vertical' },
		{ ratio: '1x2', label: 'Tall' }
	].map(({ ratio, label }) => {
		const [width, height] = ratio.split('x').map(Number);
		return {
			ratio: ratio as AspectRatioRatio,
			label,
			previewWidth: `min(100%, ${(12 * width) / height}rem)`
		};
	});
</script>

<DocPage
	title="Aspect ratio"
	subtitle="Constrains content to a fixed width-to-height ratio."
	component="AspectRatio"
	features={[
		'Bindable ref to container element',
		'Nine preset ratios (16x9, 1x1, …)',
		'Padding-bottom ratio technique',
		'Absolutely positioned content slot'
	]}
>
	<ComponentCard
		{controls}
		description="16:9 aspect ratio container."
		class="mx-auto max-w-4xl"
		code={`<AspectRatio ratio="${controls.value.ratio}">
	{#snippet children()}
		<div
			class="from-primary to-secondary flex h-full w-full items-center justify-center bg-gradient-to-br"
		>
			<span class="text-primary-contrast text-2xl font-bold">${controls.value.ratio.replace('x', ':')} Aspect Ratio</span>
		</div>
	{/snippet}
</AspectRatio>`}
	>
		<AspectRatio ratio={controls.value.ratio}>
			<div
				class="from-primary to-secondary flex h-full w-full items-center justify-center bg-gradient-to-br"
			>
				<span class="text-primary-contrast text-2xl font-bold"
					>{controls.value.ratio.replace('x', ':')} Aspect Ratio</span
				>
			</div>
		</AspectRatio>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="All Ratios"
			description="Every preset shown at its natural proportion within a shared preview height."
			class="mx-auto max-w-5xl"
			code={`<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
	{#each ratios as ratio}
		<AspectRatio ratio={ratio} />
	{/each}
</div>`}
		>
			<div class="grid w-full gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each ratios as item (item.ratio)}
					<div class="flex min-w-0 flex-col gap-3">
						<div class="flex h-52 items-center justify-center">
							<div style:width={item.previewWidth}>
								<AspectRatio ratio={item.ratio} class="rounded-md">
									<div
										class="border-neutral-muted bg-surface-floating flex h-full w-full items-center justify-center border"
									>
										<span class="text-neutral text-sm font-semibold">
											{item.ratio.replace('x', ':')}
										</span>
									</div>
								</AspectRatio>
							</div>
						</div>
						<p class="text-neutral/70 text-center text-xs">{item.label}</p>
					</div>
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
