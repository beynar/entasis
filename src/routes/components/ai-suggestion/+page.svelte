<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIComposer from '$lib/components/AIComposer/AIComposer.svelte';
	import type { AIComposerHandle } from '$lib/components/AIComposer/aiComposer.props.js';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
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
	let conversationInput = $state('');
	let composer = $state<AIComposerHandle>();
	let submitOnSelect = $state(false);
	let sent = $state<string[]>([]);

	async function pickSuggestion(suggestion: string) {
		if (submitOnSelect) {
			await composer?.submit(suggestion);
			return;
		}
		conversationInput = suggestion;
		composer?.focus();
	}
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
		},
		{
			name: 'selection',
			type: 'segmented',
			label: 'Selection',
			value: 'one-shot',
			options: ['one-shot', 'persist']
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
		'One-shot picks, optional persistent selection',
		'Bindable selected value',
		'Disabled collection and item states',
		'Custom item rendering',
		'Conversation-composed prompt insertion'
	]}
>
	<ComponentCard
		{controls}
		description="Suggestions are one-shot by default: a pick reports the value without leaving a pressed chip. Choose persist to keep it pressed. Resize the viewport to see the scroll fade indicate hidden suggestions."
		class="!min-h-[240px] px-4"
		code={`<script lang="ts">
  import { AISuggestions } from 'entasis/ai-suggestion';
${'</' + 'script>'}

<AISuggestions suggestions={items} bind:value${controls.value.variant === 'soft' ? '' : ` variant="${controls.value.variant}"`}${controls.value.selection === 'persist' ? ' persistSelection' : ''}${controls.value.interaction === 'disabled' ? ' disabled' : ''} />`}
	>
		<div class="grid max-w-full min-w-0 gap-3">
			<AISuggestions
				suggestions={items}
				bind:value
				variant={controls.value.variant}
				persistSelection={controls.value.selection === 'persist'}
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
			description="A pick fills the provider-owned input and focuses the composer's editor, so the prompt can be edited before sending. Turn on submit on select to send the suggestion straight away through the composer's submit handle."
			class="!min-h-[300px] p-4"
			code={`<AIConversation bind:currentInput>
  <AISuggestions
    suggestions={items}
    onSelect={(suggestion) =>
      submitOnSelect
        ? composer.submit(suggestion)
        : ((currentInput = suggestion), composer.focus())}
  />
  <AIComposer bind:this={composer} />
</AIConversation>`}
		>
			<div class="grid w-full max-w-2xl gap-3">
				<Switch size="small" label="Submit on select" bind:value={submitOnSelect} />
				<AIConversation
					bind:currentInput={conversationInput}
					onSubmit={({ value: sentValue }) => (sent = [...sent, sentValue ?? ''])}
				>
					<AISuggestions suggestions={items} onSelect={pickSuggestion} />
					<AIComposer bind:this={composer} />
				</AIConversation>
				<div class="text-neutral/70 text-xs" aria-live="polite">
					Sent: {sent.length ? sent.join(' · ') : 'nothing yet'}
				</div>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
