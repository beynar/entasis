<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIComposer from '$lib/components/AIComposer/AIComposer.svelte';
	import { Suggestion, Suggestions } from '$lib/components/AISuggestion/index.js';
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
	component="Suggestions"
	relatedComponents={['Suggestion']}
	features={[
		'Single Suggestion and list exports',
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
  import { Suggestions } from 'svelai/ai-suggestion';
${'</' + 'script>'}

<Suggestions suggestions={items} bind:value />`}
	>
		<div class="grid min-w-0 max-w-full gap-3">
			<Suggestions
				suggestions={items}
				bind:value
				variant={controls.value.variant}
				disabled={controls.value.interaction === 'disabled'}
			/>
			<Suggestion
				suggestion="Retry with more detail"
				variant={controls.value.variant}
				disabled={controls.value.interaction === 'disabled'}
				onSelect={(next) => (value = next)}
			/>
			<div class="text-xs text-neutral/60">Selected: {value || 'none'}</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Custom items"
			description="The item snippet receives selection state and a select action while Suggestions retains scrolling and value ownership."
			class="!min-h-[240px] px-4"
			code={`<Suggestions suggestions={items} bind:value>
  {#snippet suggestion({ suggestion, selected, select })}
    <Suggestion {suggestion} {selected} onSelect={select}>
      {#snippet children()}Prompt: {suggestion}{/snippet}
    </Suggestion>
  {/snippet}
</Suggestions>`}
		>
			<Suggestions suggestions={items} bind:value>
				{#snippet suggestion({ suggestion, selected, select })}
					<Suggestion {suggestion} {selected} onSelect={select}>
						<span>Prompt: {suggestion}</span>
					</Suggestion>
				{/snippet}
			</Suggestions>
		</ComponentCard>

		<ComponentCard
			title="Conversation composition"
			description="Selection updates the provider-owned input, which is immediately reflected by the composed AIComposer."
			class="!min-h-[280px] p-4"
			code={`<AIConversation bind:currentInput>
  <Suggestions
    suggestions={items}
    onSuggestionSelect={(suggestion) => (currentInput = suggestion)}
  />
  <AIComposer />
</AIConversation>`}
		>
			<div class="grid w-full max-w-2xl gap-3">
				<AIConversation bind:currentInput={value}>
					<Suggestions suggestions={items} onSuggestionSelect={(nextValue) => (value = nextValue)} />
					<AIComposer />
				</AIConversation>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
