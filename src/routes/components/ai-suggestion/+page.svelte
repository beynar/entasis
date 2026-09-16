<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIComposer from '$lib/components/AIComposer/AIComposer.svelte';
	import { AISuggestion, AISuggestions } from '$lib/components/AISuggestion/index.js';
	import type { ButtonVariant } from '$lib/components/Button/button.props.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const items = [
		'Add implementation details',
		'List the trade-offs',
		'Show a smaller example',
		'Identify failure states',
		'Draft release notes'
	];
	let value = $state('');
	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'soft',
			options: ['outline', 'soft', 'ghost'] satisfies readonly ButtonVariant[]
		},
		{
			name: 'interaction',
			type: 'segmented',
			label: 'State',
			value: 'enabled',
			options: ['enabled', 'disabled']
		}
	]);
</script>

<DocPage
	title="AI Suggestion"
	subtitle="Selectable prompt pills in a horizontal ScrollArea with scroll fade."
	component="AISuggestions"
	relatedComponents={['AISuggestion']}
	features={[
		'Single AISuggestion and list exports',
		'Horizontal ScrollArea composition',
		'Scroll fade enabled by default',
		'Bindable selected value',
		'Disabled collection and item states',
		'Custom item rendering',
		'Conversation-composed prompt insertion'
	]}
>
	<ComponentCard
		{controls}
		description="Resize the viewport or use a narrow screen to see the shared scroll-fade utility indicate hidden suggestions."
		class="!min-h-[240px] px-4"
		code={`<script lang="ts">
  import { AISuggestions } from 'svelai/ai-suggestion';
${'</' + 'script>'}

<AISuggestions suggestions={items} bind:value />`}
	>
		<div class="grid max-w-full min-w-0 gap-3">
			<AISuggestions
				suggestions={items}
				bind:value
				variant={controls.value.variant}
				disabled={controls.value.interaction === 'disabled'}
			/>
			<AISuggestion
				suggestion="Retry with more detail"
				variant={controls.value.variant}
				disabled={controls.value.interaction === 'disabled'}
				onSelect={(next) => (value = next)}
			/>
			<div class="text-neutral/70 text-xs">Selected: {value || 'none'}</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Custom items"
			description="The item snippet receives selection state and a select action while AISuggestions retains scrolling and value ownership."
			class="!min-h-[240px] px-4"
			code={`<AISuggestions suggestions={items} bind:value>
  {#snippet suggestion({ suggestion, selected, select })}
    <AISuggestion {suggestion} {selected} onSelect={select}>
      {#snippet children()}Prompt: {suggestion}{/snippet}
    </AISuggestion>
  {/snippet}
</AISuggestions>`}
		>
			<AISuggestions suggestions={items} bind:value>
				{#snippet suggestion({ suggestion, selected, select })}
					<AISuggestion {suggestion} {selected} onSelect={select}>
						<span>Prompt: {suggestion}</span>
					</AISuggestion>
				{/snippet}
			</AISuggestions>
		</ComponentCard>

		<ComponentCard
			title="Conversation composition"
			description="Selection updates the provider-owned input, which is immediately reflected by the composed AIComposer."
			class="!min-h-[280px] p-4"
			code={`<AIConversation bind:currentInput>
  <AISuggestions
    suggestions={items}
    onSelect={(suggestion) => (currentInput = suggestion)}
  />
  <AIComposer />
</AIConversation>`}
		>
			<div class="grid w-full max-w-2xl gap-3">
				<AIConversation bind:currentInput={value}>
					<AISuggestions suggestions={items} onSelect={(nextValue) => (value = nextValue)} />
					<AIComposer />
				</AIConversation>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
