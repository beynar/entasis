<script lang="ts">
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const paragraphs = Array.from({ length: 12 }, (_, i) => i + 1);
	const types = ['hover', 'always', 'scroll', 'auto'] as const;
	const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];
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
		'data-scrolling and overflow-edge attributes and CSS variables for styling',
		'Right-to-left horizontal scrolling with logical scrollbar placement',
		{
			label: 'Thumb drags keep focus where it is and pause scroll snapping',
			test: 'a11y:scroll-area.thumb-keeps-focus'
		},
		{
			label: 'Keyboard-focusable region only when it overflows (WCAG SCR34)',
			test: 'a11y:scroll-area.tabbable-on-overflow'
		},
		{
			label: 'Unnamed until it overflows; scrollbars hidden from screen readers',
			test: 'a11y:scroll-area.accessibility-tree'
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

		<ComponentCard
			description="Overflow-edge hooks: the borders appear only while content is hidden past that edge (data-overflow-y-start, data-overflow-y-end), and data-scrolling marks the area while it scrolls."
		>
			<ScrollArea
				type="always"
				class="raised data-overflow-y-end:border-b-primary data-overflow-y-start:border-t-primary h-40 w-full max-w-md border-y-2 border-transparent transition-colors"
			>
				<div class="flex flex-col gap-3 p-4">
					{#each paragraphs as p, index (index)}
						<p class="text-neutral/80 text-sm">Paragraph {p}. Scroll to see the edges change.</p>
					{/each}
				</div>
			</ScrollArea>
		</ComponentCard>

		<ComponentCard
			description="Right-to-left: the offset runs negative, the horizontal thumb starts at the right, and the vertical bar sits at the left."
		>
			<div dir="rtl" class="w-full max-w-md">
				<ScrollArea type="always" class="raised h-40 w-full">
					<div class="flex gap-3 p-4" style:width="900px">
						{#each paragraphs as p, index (index)}
							<div
								class="bg-neutral-muted text-neutral/80 grid h-60 w-32 shrink-0 place-items-center rounded text-sm"
							>
								{p}
							</div>
						{/each}
					</div>
				</ScrollArea>
			</div>
		</ComponentCard>

		<ComponentCard
			description="viewportAttrs lets a widget own the viewport: here the scrolling element is the listbox itself."
		>
			<ScrollArea
				type="always"
				class="raised h-32 w-full max-w-xs"
				viewportAttrs={{ role: 'listbox', 'aria-label': 'Fruits', tabindex: 0 }}
			>
				{#each fruits as fruit, index (index)}
					<div role="option" aria-selected="false" class="text-neutral/80 px-3 py-2 text-sm">
						{fruit}
					</div>
				{/each}
			</ScrollArea>
		</ComponentCard>
	{/snippet}
</DocPage>
