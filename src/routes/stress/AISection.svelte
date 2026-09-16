<script lang="ts">
	import { AIComposer } from '$lib/components/AIComposer/index.js';
	import { AIContext } from '$lib/components/AIContext/index.js';
	import { AIMessage } from '$lib/components/AIMessage/index.js';
	import { AIModelSelector } from '$lib/components/AIModelSelector/index.js';
	import { AIReasoning } from '$lib/components/AIReasoning/index.js';
	import { AISuggestion, AISuggestions } from '$lib/components/AISuggestion/index.js';
	import { AITool } from '$lib/components/AITool/index.js';
	import type { Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import { colors, sizes } from './fixtures.js';

	let { size = 'normal' }: { size?: Sizes } = $props();

	const toolVariants = ['card', 'ghost', 'outline', 'soft'] as const;

	// Carries newlines and backticks, so it lives in the script rather than in an attribute.
	const assistantReply =
		'Each component reads a semantic role and resolves it against the active theme.\n\n- `color` picks the role\n- `variant` picks the surface treatment';

	const toolCalls = [
		{
			id: 'call-1',
			name: 'search_docs',
			title: 'Search documentation',
			status: 'success',
			input: { query: 'theming tokens', limit: 5 },
			output: { hits: 3, top: 'theme.designTokens.ts' }
		},
		{
			id: 'call-2',
			name: 'write_file',
			title: 'Write file',
			status: 'running',
			input: { path: 'src/routes/stress/+page.svelte' }
		},
		{
			id: 'call-3',
			name: 'run_tests',
			title: 'Run tests',
			status: 'error',
			input: { suite: 'unit' },
			error: 'Exit code 1: 2 assertions failed'
		}
	];

	const models = [
		{ id: 'opus', label: 'Opus', provider: 'Anthropic', contextWindow: 1000000 },
		{ id: 'sonnet', label: 'Sonnet', provider: 'Anthropic', contextWindow: 200000 },
		{ id: 'haiku', label: 'Haiku', provider: 'Anthropic', disabled: true }
	];

	const suggestions = [
		'Summarize this thread',
		'Explain the theming model',
		'List the failing tests',
		'Draft a migration plan'
	];
</script>

<Section
	id="ai"
	title="AI"
	description="AIMessage, AIComposer, AIReasoning, AISuggestion/AISuggestions, AITool, AIContext, AIModelSelector — all with static props."
>
	<Matrix caption="AIMessage" varies="from (user, assistant), variant, size" layout="stack">
		{#each ['bubble', 'minimal'] as const as variant (variant)}
			<div class="gap-sm border-neutral-muted bg-surface p-md grid rounded-lg border">
				<AIMessage
					{variant}
					{size}
					from="user"
					content="How does the theming layer resolve component colors?"
				/>
				<AIMessage {variant} {size} from="assistant" content={assistantReply} />
			</div>
		{/each}
		{#each sizes as messageSize (messageSize)}
			<div class="border-neutral-muted bg-surface p-md rounded-lg border">
				<AIMessage size={messageSize} from="assistant" content="Size {messageSize} message." />
			</div>
		{/each}
	</Matrix>

	<Matrix
		caption="AIComposer"
		varies="busy, disabled, toolbar"
		note="Rich-text body mounts client-side; suggestions and uploads are wired to no-ops here."
		layout="stack"
	>
		<AIComposer placeholder="Ask anything…" toolbar="hover" />
		<AIComposer placeholder="Busy state" busy />
		<AIComposer placeholder="Disabled state" disabled />
	</Matrix>

	<Matrix caption="AIReasoning" varies="open, streaming, duration" layout="stack">
		<AIReasoning
			content="Checking the theme contract first, then the component props."
			defaultOpen
			duration={4}
		/>
		<AIReasoning content="Still thinking…" streaming />
		<AIReasoning content="Collapsed reasoning block." duration={12} />
	</Matrix>

	<Matrix caption="AISuggestion" varies="color, variant, selected, disabled">
		{#each colors as color (color)}
			<AISuggestion suggestion="Suggestion {color}" {color} variant="outline" {size} />
		{/each}
		<AISuggestion suggestion="Selected" color="primary" variant="soft" {size} selected />
		<AISuggestion suggestion="Disabled" color="neutral" variant="outline" {size} disabled />
	</Matrix>

	<Matrix caption="AISuggestions" varies="variant, disabled" layout="stack">
		<AISuggestions {suggestions} variant="outline" />
		<AISuggestions {suggestions} variant="soft" defaultValue={suggestions[1]} />
		<AISuggestions {suggestions} variant="ghost" disabled />
	</Matrix>

	{#each toolVariants as variant (variant)}
		<Matrix
			caption="AITool — variant {variant}"
			varies="status (success, running, error)"
			layout="stack"
		>
			<AITool {variant} tools={toolCalls} defaultValue={['call-1']} multiple />
		</Matrix>
	{/each}

	<Matrix
		caption="AIContext"
		varies="usage tone (default, warning, danger), compact"
		layout="grid"
		class="items-start"
	>
		<AIContext maxTokens={200000} usedTokens={42000} />
		<AIContext maxTokens={200000} usedTokens={168000} />
		<AIContext maxTokens={200000} usedTokens={196000} />
		<AIContext maxTokens={200000} usedTokens={90000} compact />
		<AIContext
			maxTokens={200000}
			usage={{
				inputTokens: 60000,
				outputTokens: 12000,
				reasoningTokens: 8000,
				cachedInputTokens: 30000
			}}
		/>
	</Matrix>

	<Matrix caption="AIModelSelector" varies="value, searchable, disabled">
		<AIModelSelector {models} defaultValue="opus" />
		<AIModelSelector {models} defaultValue="sonnet" searchable />
		<AIModelSelector {models} defaultValue="opus" disabled />
		<AIModelSelector
			groups={[
				{ label: 'Frontier', models: models.slice(0, 2) },
				{ label: 'Fast', models: models.slice(2) }
			]}
			defaultValue="sonnet"
		/>
	</Matrix>
</Section>
