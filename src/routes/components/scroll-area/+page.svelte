<script lang="ts">
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const paragraphs = Array.from({ length: 12 }, (_, i) => i + 1);
	const types = ['hover', 'always', 'scroll', 'auto'] as const;
	const controls = createComponentControls([
		{
			name: 'type',
			type: 'segmented',
			label: 'Type',
			value: 'hover',
			options: types
		},
		{ name: 'scrollFade', type: 'switch', label: 'Scroll fade', value: true }
	]);
</script>

<DocPage
	title="Scroll area"
	subtitle="A custom scroll container with overlay scrollbars, replacing the native ones."
	component="ScrollArea"
	features={[
		'Custom overlay scrollbars, native ones hidden',
		'Vertical and horizontal thumbs with drag',
		'hover, always, scroll, and auto visibility modes',
		'Optional scroll fade via the shared utility',
		{
			label: 'Keyboard-focusable region only when it overflows (WCAG SCR34)',
			test: 'a11y:scroll-area.tabbable-on-overflow'
		}
	]}
>
	<ComponentCard
		{controls}
		code={`<ScrollArea type="${controls.value.type}" scrollFade={${controls.value.scrollFade}} class="raised h-52 w-full max-w-md">
	<div class="flex flex-col gap-3 p-4">
		<!-- long content -->
	</div>
</ScrollArea>`}
	>
		<ScrollArea
			type={controls.value.type}
			scrollFade={controls.value.scrollFade}
			class="raised h-52 w-full max-w-md"
		>
			<div class="flex flex-col gap-3 p-4">
				{#each paragraphs as p, index (index)}
					<p class="text-neutral/80 text-sm">
						Paragraph {p}. The quick brown fox jumps over the lazy dog. Scroll to see the custom
						overlay scrollbar appear on hover.
					</p>
				{/each}
			</div>
		</ScrollArea>
	</ComponentCard>

	{#snippet examples()}
		{#each types as type, index (index)}
			<ComponentCard description={`type="${type}"`}>
				<ScrollArea {type} class="raised h-52 w-full max-w-md">
					<div class="flex flex-col gap-3 p-4">
						{#each paragraphs as p, index (index)}
							<p class="text-neutral/80 text-sm">
								Paragraph {p}. The quick brown fox jumps over the lazy dog.
							</p>
						{/each}
					</div>
				</ScrollArea>
			</ComponentCard>
		{/each}

		<ComponentCard description="Horizontal overflow: a wide child produces a horizontal scrollbar.">
			<ScrollArea type="always" scrollFade class="raised h-40 w-full max-w-md">
				<div class="flex gap-3 p-4">
					{#each paragraphs as p, index (index)}
						<div
							class="bg-neutral-muted text-neutral/80 grid aspect-square w-40 shrink-0 place-items-center rounded text-sm"
						>
							Card {p}
						</div>
					{/each}
				</div>
			</ScrollArea>
		</ComponentCard>
	{/snippet}
</DocPage>
