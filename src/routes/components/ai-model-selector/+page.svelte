<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIModelSelector from '$lib/components/AIModelSelector/AIModelSelector.svelte';
	import type { AIModelSelectorMenuItem } from '$lib/components/AIModelSelector/aiModelSelector.props.js';
	import TextInput from '$lib/components/Form/TextInput/TextInput.svelte';
	import { brainIcon } from '$lib/components/Icons/brain.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { speedometerIcon } from '$lib/components/Icons/speedometer.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const models = [
		{
			id: 'swift',
			label: 'Swift',
			provider: 'Svelai',
			description: 'Fast everyday responses',
			contextWindow: 128_000,
			keywords: ['quick', 'chat']
		},
		{
			id: 'deep',
			label: 'Deep',
			provider: 'Svelai',
			description: 'Long-form reasoning',
			contextWindow: 256_000,
			keywords: ['analysis', 'reasoning']
		},
		{ id: 'retired', label: 'Legacy', provider: 'Svelai', disabled: true }
	];
	const groups = [
		{
			label: 'Svelai',
			models: models.slice(0, 2),
			groups: [
				{
					label: 'Research',
					models: [
						{
							id: 'research-large',
							label: 'Research Large',
							description: 'Long-context source analysis',
							contextWindow: 1_000_000,
							keywords: ['citations', 'sources']
						}
					]
				}
			]
		}
	];
	const labelModels = [
		models[0],
		{
			id: 'local',
			label: 'Local',
			description: 'Runs on this device',
			contextWindow: 32_000
		}
	];
	const selectorLabels = {
		placeholder: 'Choose engine',
		triggerAriaLabel: 'Choose an engine',
		searchPlaceholder: 'Filter engines',
		empty: 'No engine found',
		providerFallback: 'On device'
	};
	let value = $state('swift');
	const controls = createComponentControls([
		{
			name: 'source',
			type: 'segmented',
			label: 'Data',
			value: 'flat',
			options: ['flat', 'grouped']
		},
		{
			name: 'search',
			type: 'segmented',
			label: 'Search',
			value: 'shown',
			options: ['shown', 'hidden']
		},
		{
			name: 'availability',
			type: 'segmented',
			label: 'State',
			value: 'enabled',
			options: ['enabled', 'disabled']
		}
	]);
	const exampleControls = createComponentControls([
		{
			name: 'example',
			type: 'segmented',
			label: 'Example',
			value: 'conversation',
			options: [
				{ value: 'conversation', label: 'Conversation' },
				{ value: 'settings', label: 'Settings' },
				{ value: 'composition', label: 'Composition' },
				{ value: 'explicit-empty', label: 'Direct empty' },
				{ value: 'labels', label: 'Labels' }
			]
		}
	]);
	let open = $state(false);
	let query = $state('');
	let conversationValue = $state('deep');
	let composedValue = $state<string | null>('swift');
	let composedQuery = $state('');
	let explicitValue = $state<string | null>(null);
	let reasoningEffort = $state<'low' | 'medium' | 'high'>('medium');
	let responseSpeed = $state<'standard' | 'fast'>('standard');
	const searchable = $derived(controls.value.search === 'shown');
	const settingsMenuItems = $derived.by((): AIModelSelectorMenuItem[] => [
		{
			type: 'submenu',
			title: 'Reasoning effort',
			prefix: brainIcon,
			suffix: formatChoice(reasoningEffort),
			menu: (['low', 'medium', 'high'] as const).map((effort) => ({
				type: 'option',
				role: 'menuitemradio',
				title: formatChoice(effort),
				suffix: reasoningEffort === effort ? checkIcon : undefined,
				attrs: { 'aria-checked': reasoningEffort === effort },
				onclick: () => (reasoningEffort = effort)
			}))
		},
		{
			type: 'submenu',
			title: 'Response speed',
			prefix: speedometerIcon,
			suffix: formatChoice(responseSpeed),
			menu: (['standard', 'fast'] as const).map((speed) => ({
				type: 'option',
				role: 'menuitemradio',
				title: formatChoice(speed),
				suffix: responseSpeed === speed ? checkIcon : undefined,
				attrs: { 'aria-checked': responseSpeed === speed },
				onclick: () => (responseSpeed = speed)
			}))
		}
	]);

	function formatChoice(value: string) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	const examples = {
		conversation: {
			title: 'Conversation selection',
			description: 'Omit value to read and update AIConversation.selectedModel.',
			code: `<AIConversation bind:selectedModel>
  <AIModelSelector {models} />
</AIConversation>`
		},
		settings: {
			title: 'Nested model settings',
			description:
				'Append standard MenuItem entries for checked submenus without coupling the selector to one provider API.',
			code: `<script lang="ts">
  import {
    AIModelSelector,
    type AIModelSelectorMenuItem
  } from 'svelai/ai-model-selector';

  let reasoning = $state('medium');
  const menuItems = $derived<AIModelSelectorMenuItem[]>([
    {
      type: 'submenu',
      title: 'Reasoning effort',
      suffix: reasoning,
      menu: ['low', 'medium', 'high'].map((effort) => ({
        type: 'option',
        title: effort,
        suffix: reasoning === effort ? 'Selected' : undefined,
        onclick: () => (reasoning = effort)
      }))
    }
  ]);
${'</' + 'script>'}

<AIModelSelector {models} {menuItems} searchable={false} />`
		},
		composition: {
			title: 'Custom trigger, search, and empty state',
			description: 'Every composition slot receives the complete bindable selector state.',
			code: `<AIModelSelector {models} bind:value bind:query>
  {#snippet children({ model })}{model?.label ?? 'Choose a model'}{/snippet}
  {#snippet search({ query, setQuery })}
    <TextInput value={query} onValueChange={(value) => setQuery(value ?? '')} />
  {/snippet}
  {#snippet empty({ query })}No model matches "{query}".{/snippet}
</AIModelSelector>`
		},
		'explicit-empty': {
			title: 'Presence-aware direct state',
			description:
				'A direct null value and placeholder suppress conversation defaults while omission inherits them.',
			code: `<script lang="ts">
  let explicitValue = $state<string | null>(null);
${'</' + 'script>'}

<AIConversation selectedModel="deep">
  <AIModelSelector {models} />
  <AIModelSelector {models} bind:value={explicitValue} placeholder={null} />
</AIConversation>`
		},
		labels: {
			title: 'Custom labels',
			description:
				'One object controls trigger, search, empty-result, and provider-fallback wording.',
			code: `<AIModelSelector
  models={labelModels}
  labels={{
    placeholder: 'Choose engine',
    triggerAriaLabel: 'Choose an engine',
    searchPlaceholder: 'Filter engines',
    empty: 'No engine found',
    providerFallback: 'On device'
  }}
/>`
		}
	} as const;
	const selectedExample = $derived(examples[exampleControls.value.example]);
</script>

<DocPage
	title="AI Model Selector"
	subtitle="Model selection and nested settings through PopupMenu, Popover, and Menu."
	component="AIModelSelector"
	features={[
		'PopupMenu trigger with Popover and Menu composition',
		'Flat models and nested groups',
		'Toggleable model search',
		'Additional recursive MenuItem settings',
		'Disabled model states',
		'Provider and keyword search metadata',
		'Context-window labels',
		'Provider-aware overridable labels',
		'Conversation-scoped selected model',
		'Custom trigger, search, and empty slots'
	]}
>
	<ComponentCard
		{controls}
		description="Select a model from flat or nested sources. Direct value props override the nearest conversation default."
		class="!min-h-[240px]"
		code={`<script lang="ts">
  import { AIModelSelector } from 'svelai/ai-model-selector';
${'</' + 'script>'}


<AIModelSelector {models} {groups} {searchable} bind:value bind:open bind:query />`}
	>
		<div class="grid justify-items-center gap-3">
			<AIModelSelector
				models={controls.value.source === 'grouped' ? [] : models}
				groups={controls.value.source === 'grouped' ? groups : []}
				{searchable}
				disabled={controls.value.availability === 'disabled'}
				bind:value
				bind:open
				bind:query
			/>
			<div class="text-neutral/70 text-center text-xs">
				Selected: {value} · Search: {searchable ? 'shown' : 'hidden'} · Query: {query || 'none'}
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			controls={exampleControls}
			title={selectedExample.title}
			description={selectedExample.description}
			class="!min-h-[260px]"
			code={selectedExample.code}
		>
			{#if exampleControls.value.example === 'conversation'}
				<div class="grid justify-items-center gap-3">
					<AIConversation bind:selectedModel={conversationValue}>
						<AIModelSelector {models} />
					</AIConversation>
					<div class="text-neutral/70 text-xs">Conversation value: {conversationValue}</div>
				</div>
			{:else if exampleControls.value.example === 'settings'}
				<div class="grid justify-items-center gap-3">
					<AIModelSelector
						{models}
						menuItems={settingsMenuItems}
						searchable={false}
						bind:value={composedValue}
					/>
					<div class="text-neutral/70 text-xs">
						Reasoning: {formatChoice(reasoningEffort)} · Speed: {formatChoice(responseSpeed)}
					</div>
				</div>
			{:else if exampleControls.value.example === 'composition'}
				<div class="grid justify-items-center gap-3">
					<AIModelSelector {models} bind:value={composedValue} bind:query={composedQuery}>
						{#snippet children({ model })}
							<span class="min-w-24 truncate text-left">{model?.label ?? 'Choose a model'}</span>
						{/snippet}
						{#snippet search({ query, setQuery })}
							<TextInput
								value={query}
								size="small"
								placeholder="Search label, provider, or keyword"
								label="Search label, provider, or keyword"
								theme={{ label: { base: 'sr-only' } }}
								onValueChange={(nextValue) => setQuery(nextValue ?? '')}
							/>
						{/snippet}
						{#snippet empty({ query })}
							<span class="block px-2 py-1 text-left">No model matches "{query}".</span>
						{/snippet}
					</AIModelSelector>
					<div class="text-neutral/70 text-xs">
						Query: {composedQuery || 'none'} · Selected: {composedValue ?? 'none'}
					</div>
				</div>
			{:else if exampleControls.value.example === 'explicit-empty'}
				<div class="grid justify-items-center gap-3">
					<AIConversation selectedModel="deep">
						<div class="flex flex-wrap items-center justify-center gap-2">
							<AIModelSelector {models} />
							<AIModelSelector {models} bind:value={explicitValue} placeholder={null} />
						</div>
					</AIConversation>
					<div class="text-neutral/70 text-xs">Inherited model · Direct empty</div>
				</div>
			{:else}
				<AIModelSelector models={labelModels} labels={selectorLabels} />
			{/if}
		</ComponentCard>
	{/snippet}
</DocPage>
