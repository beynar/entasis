<script lang="ts">
	import AIContext from '$lib/components/AIContext/AIContext.svelte';
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'tone',
			type: 'segmented',
			label: 'State',
			value: 'default',
			options: ['default', 'warning', 'danger']
		},
		{
			name: 'layout',
			type: 'segmented',
			label: 'Layout',
			value: 'full',
			options: ['full', 'compact']
		}
	]);
	const exampleControls = createComponentControls([
		{
			name: 'example',
			type: 'segmented',
			label: 'Example',
			value: 'conversation',
			options: ['conversation', 'composition', 'formatter', 'labels']
		}
	]);
	const usedTokens = $derived(
		{ default: 56_000, warning: 96_000, danger: 118_000 }[controls.value.tone]
	);
	const compact = $derived(controls.value.layout === 'compact');
	let contextUsage = $state({ inputTokens: 42_000, outputTokens: 9_000, reasoningTokens: 5_000 });
	const contextLabels = {
		title: 'Token budget',
		remaining: (tokens: string) => tokens + ' available',
		input: 'Prompt',
		output: 'Completion',
		reasoning: 'Analysis',
		cachedInput: 'Cache',
		used: 'Consumed',
		maximum: 'Limit',
		label: (used: string, maximum: string, remaining: string) =>
			used + ' of ' + maximum + ' consumed; ' + remaining + ' available.'
	};
	const examples = {
		conversation: {
			title: 'Conversation usage',
			description:
				'Omit usage to read the nearest AIConversation value. Direct usage or usedTokens props take precedence.',
			code: `<AIConversation bind:contextUsage>
  <AIContext maxTokens={128000} compact />
</AIConversation>`
		},
		composition: {
			title: 'Custom trigger and details',
			description:
				'Both slots receive the same resolved totals, percentage, tone, and formatted labels.',
			code: `<AIContext maxTokens={128000} usedTokens={96000}>
  {#snippet children({ percent, tone })}
    <button type="button">{Math.round(percent)}% · {tone}</button>
  {/snippet}
  {#snippet content({ formattedRemaining })}
    <div>{formattedRemaining} tokens remaining</div>
  {/snippet}
</AIContext>`
		},
		formatter: {
			title: 'Custom formatter',
			description: 'formatTokens controls every value shown in the trigger and breakdown.',
			code: `<AIContext
  maxTokens={128000}
  usedTokens={51200}
  formatTokens={(tokens) => tokens.toLocaleString()}
/>`
		},
		labels: {
			title: 'Custom labels',
			description:
				'The labels contract owns visible copy, runtime grammar, and the trigger accessible name.',
			code: `<AIContext
  maxTokens={128000}
  usedTokens={51200}
  labels={{
    title: 'Token budget',
    remaining: (tokens) => tokens + ' available',
    input: 'Prompt',
    output: 'Completion',
    reasoning: 'Analysis',
    cachedInput: 'Cache',
    used: 'Consumed',
    maximum: 'Limit',
    label: (used, maximum, remaining) =>
      used + ' of ' + maximum + ' consumed; ' + remaining + ' available.'
  }}
/>`
		}
	} as const;
	const selectedExample = $derived(examples[exampleControls.value.example]);

	function formatTokensExact(tokens: number) {
		return tokens.toLocaleString('en-US');
	}
</script>

<DocPage
	title="AI Context"
	subtitle="Token-window progress and breakdown through ProgressCircle and HoverCard."
	component="AIContext"
	features={[
		'Usage totals and category breakdown',
		'70% warning and 90% danger defaults',
		'Compact trigger mode',
		'Custom token formatter',
		'Overridable visible and accessible labels',
		'Conversation-scoped usage fallback',
		'Custom trigger and content snippets'
	]}
>
	<ComponentCard
		{controls}
		description="Change the token count to exercise default, warning, and danger states, then hover the trigger for the breakdown."
		class="!min-h-[260px]"
		code={`<script lang="ts">
  import { AIContext } from 'entasis/ai-context';
${'</' + 'script>'}


<AIContext maxTokens={128000} {usedTokens} {compact} />`}
	>
		<AIContext maxTokens={128_000} {usedTokens} {compact} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			controls={exampleControls}
			title={selectedExample.title}
			description={selectedExample.description}
			class="!min-h-[240px]"
			code={selectedExample.code}
		>
			{#if exampleControls.value.example === 'conversation'}
				<AIConversation bind:contextUsage>
					<AIContext maxTokens={128_000} compact />
				</AIConversation>
			{:else if exampleControls.value.example === 'composition'}
				<AIContext maxTokens={128_000} usedTokens={96_000}>
					{#snippet children({ percent, tone })}
						<button
							type="button"
							class="state-layer border-neutral-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
						>
							<span>{Math.round(percent)}% used</span>
							<span class="text-neutral/65 capitalize">{tone}</span>
						</button>
					{/snippet}
					{#snippet content({ formattedUsed, formattedMax, formattedRemaining })}
						<div class="grid min-w-64 gap-2 p-4 text-sm">
							<div class="font-medium">Custom context details</div>
							<div class="text-neutral/65">{formattedUsed} of {formattedMax} used</div>
							<div>{formattedRemaining} tokens remaining</div>
						</div>
					{/snippet}
				</AIContext>
			{:else if exampleControls.value.example === 'formatter'}
				<AIContext maxTokens={128_000} usedTokens={51_200} formatTokens={formatTokensExact} />
			{:else}
				<AIContext maxTokens={128_000} usedTokens={51_200} labels={contextLabels} />
			{/if}
		</ComponentCard>
	{/snippet}
</DocPage>
