<script lang="ts">
	import AIMarker from '$lib/components/AIMarker/AIMarker.svelte';
	import { fileTextIcon } from '$lib/components/Icons/fileText.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: ['default', 'separator', 'border']
		},
		{
			name: 'composition',
			type: 'segmented',
			label: 'Content',
			value: 'icon',
			options: ['children', 'icon', 'content']
		}
	]);
</script>

{#snippet markerIcon()}
	{@render fileTextIcon({ size: 16 })}
{/snippet}

{#snippet markerContent()}
	<span>Imported <strong>3 files</strong></span>
{/snippet}

<DocPage
	title="AI Marker"
	subtitle="Semantic transcript boundaries in default, separator, and bordered treatments."
	component="AIMarker"
	features={[
		'Default, separator, and border variants',
		'Existing Separator primitive',
		'Child, icon, and content snippets',
		'Transcript marker item support',
		'Semantic theme slots'
	]}
>
	<ComponentCard
		{controls}
		description="Choose the visual boundary that matches the transcript event without changing message semantics."
		class="!min-h-[280px]"
		code={`<script lang="ts">
  import { AIMarker } from 'entasis/ai-marker';
  import { fileTextIcon } from 'entasis/icons/fileText';
${'</' + 'script>'}

{#snippet markerIcon()}
  {@render fileTextIcon({ size: 16 })}
{/snippet}

{#snippet markerContent()}
  <span>Imported <strong>3 files</strong></span>
{/snippet}

<AIMarker>Earlier today</AIMarker>
<AIMarker variant="separator" icon={markerIcon}>New context</AIMarker>
<AIMarker variant="border" content={markerContent} />`}
	>
		<AIMarker
			variant={controls.value.variant}
			icon={controls.value.composition === 'icon' ? markerIcon : undefined}
			content={controls.value.composition === 'content' ? markerContent : undefined}
			aria-label="System checkpoint"
			class="text-neutral/80 w-full max-w-2xl"
		>
			{#if controls.value.composition !== 'content'}System checkpoint{/if}
		</AIMarker>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Icon slot"
			description="Icons without an explicit size class inherit the marker's stable 16px slot sizing."
			class="!min-h-[220px] p-4"
			code={`{#snippet icon()}
  {@render fileTextIcon({ size: 16 })}
{/snippet}

<AIMarker {icon}>Imported files</AIMarker>`}
		>
			<AIMarker icon={markerIcon}>Imported files</AIMarker>
		</ComponentCard>

		<ComponentCard
			title="Content slot"
			description="Use content for rich inline marker labels while children remains the simple fallback."
			class="!min-h-[220px] p-4"
			code={`{#snippet content()}
  <span>Imported <strong>3 files</strong></span>
{/snippet}

<AIMarker variant="separator" {content} />`}
		>
			<AIMarker variant="separator" content={markerContent} />
		</ComponentCard>
	{/snippet}
</DocPage>
