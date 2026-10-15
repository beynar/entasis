<script lang="ts">
	import AITool from '$lib/components/AITool/AITool.svelte';
	import type {
		AIToolCall,
		AIToolToggleIcon,
		AIToolValueView,
		AIToolVariant
	} from '$lib/components/AITool/aiTool.props.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const circular: Record<string, unknown> = { name: 'launch-plan' };
	circular.self = circular;

	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ghost',
			options: ['card', 'ghost', 'outline', 'soft']
		},
		{
			name: 'status',
			type: 'segmented',
			label: 'Status',
			value: 'running',
			options: [
				{ value: 'running', label: 'Running' },
				{ value: 'success', label: 'Success' },
				{ value: 'error', label: 'Error' },
				{ value: 'approval-requested', label: 'Approval' },
				{ value: 'output-denied', label: 'Denied' }
			]
		},
		{
			name: 'valueView',
			type: 'segmented',
			label: 'Values',
			value: 'json',
			options: ['json', 'tree']
		},
		{
			name: 'toggleIcon',
			type: 'segmented',
			label: 'Toggle',
			value: 'none',
			options: ['none', 'chevron', 'plus-minus']
		},
		{
			name: 'expansionMode',
			type: 'segmented',
			label: 'Expansion',
			value: 'multiple',
			options: [
				{ value: 'multiple', label: 'Multiple' },
				{ value: 'single', label: 'Single' }
			]
		}
	]);
	let openTools = $state<string[]>(['search']);
	const variant = $derived(controls.value.variant as AIToolVariant);
	const toggleIcon = $derived(controls.value.toggleIcon as AIToolToggleIcon);
	const multiple = $derived(controls.value.expansionMode === 'multiple');
	const valueView = $derived(controls.value.valueView as AIToolValueView);
	// A stable start, so the running call shows a live elapsed time.
	const startedAt = Date.now();
	const toolCalls = $derived<AIToolCall[]>([
		{
			id: 'search',
			name: 'searchDocs',
			input: { query: 'launch risk' },
			output: { matches: 3 },
			duration: 1_400
		},
		{
			id: 'read',
			name: 'read_resource',
			title: 'Read launch plan',
			status: controls.value.status,
			input: { uri: 'docs://launch-plan' },
			output: controls.value.status === 'success' ? circular : undefined,
			startedAt,
			error:
				controls.value.status === 'error'
					? new Error('The launch plan could not be read.')
					: undefined
		}
	]);
	const approvalTools: AIToolCall[] = [
		{
			id: 'deploy',
			name: 'deploy_preview',
			status: 'approval-requested',
			input: { branch: 'release/1.4' }
		},
		{
			id: 'drop',
			name: 'dropTable',
			status: 'output-denied',
			input: { table: 'sessions' },
			approval: { approved: false, reason: 'Not on production' }
		}
	];
	const iconTool: AIToolCall = {
		id: 'web',
		name: 'web_search',
		title: 'Searched the web',
		icon: magnifyingGlassIcon,
		input: { query: 'svelte 5 attachments' },
		output: [{ title: 'Attachments', url: 'https://svelte.dev/docs/svelte/@attach' }],
		duration: 2_300
	};
	const failedTool: AIToolCall = {
		name: 'deploy',
		title: 'Deploy preview',
		error: new Error('Deployment was rejected')
	};
	const analysisTool: AIToolCall = {
		name: 'analyze_release',
		input: { branch: 'main' },
		output: { score: 92, blockers: 0 }
	};
</script>

<DocPage
	title="AI Tool"
	subtitle="Accordion rendering for one tool call or a consecutive group, with bounded arbitrary-value inspection."
	component="AITool"
	features={[
		'Single-call and aggregate group composition with one shared surface',
		'Readable titles, optional icons, input summaries, status words and durations',
		'AI SDK approval states: awaiting approval, approved, denied',
		'Highlighted, copyable JSON or a key/value tree',
		'Plain-sentence errors and a “Show all” cap for long values',
		'Circular-safe, depth- and entry-bounded values'
	]}
>
	<ComponentCard
		{controls}
		description="Change the second call status and whether nested calls may remain open together. Raw names are humanized (searchDocs → Search docs), the running call counts its elapsed time, errors read as one sentence, and circular values stay bounded."
		class="!min-h-[340px] p-4"
		code={`<script lang="ts">
  import { AITool, type AIToolCall } from 'entasis/ai-tool';

  const circular: Record<string, unknown> = { name: 'launch-plan' };
  circular.self = circular;

  let status = $state<'running' | 'success' | 'error'>('running');
  let variant = $state<'card' | 'ghost' | 'outline' | 'soft'>('ghost');
  let toggleIcon = $state<'none' | 'chevron' | 'plus-minus'>('none');
  let openTools = $state<string[]>(['search']);
  let multiple = $state(true);
  const startedAt = Date.now();
  const toolCalls = $derived<AIToolCall[]>([
    {
      id: 'search',
      name: 'searchDocs',
      input: { query: 'launch risk' },
      output: { matches: 3 },
      duration: 1_400
    },
    {
      id: 'read',
      name: 'read_resource',
      title: 'Read launch plan',
      status,
      input: { uri: 'docs://launch-plan' },
      output: status === 'success' ? circular : undefined,
      startedAt,
      error: status === 'error' ? new Error('The launch plan could not be read.') : undefined
    }
  ]);
${'</' + 'script>'}

<AITool
  tools={toolCalls}
  bind:value={openTools}
  multiple={${multiple}}
  variant="${variant}"
  toggleIcon="${toggleIcon}"
  valueView="${valueView}"
  aria-label="Tool calls"
/>`}
	>
		<AITool
			tools={toolCalls}
			bind:value={openTools}
			{multiple}
			{variant}
			{toggleIcon}
			{valueView}
			aria-label="Tool calls"
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Approval states"
			description="AI SDK approval parts map onto approval-requested, approval-responded and output-denied with getAIToolStatusFromState. Awaiting and denied calls never spin."
			class="!min-h-[200px] p-4"
			code={`<script lang="ts">
  import { AITool, getAIToolStatusFromState } from 'entasis/ai-tool';

  // part.state: 'approval-requested' | 'approval-responded' | 'output-denied' | ...
  const tools = parts.map((part) => ({
    id: part.toolCallId,
    name: part.type.slice('tool-'.length),
    status: getAIToolStatusFromState(part.state),
    approval: part.approval,
    input: part.input,
    output: part.output,
    error: part.errorText
  }));
${'</' + 'script>'}

<AITool {tools} />`}
		>
			<AITool tools={approvalTools} />
		</ComponentCard>

		<ComponentCard
			title="Icon and duration"
			description="A per-call icon takes the leading place and the status moves next to its word; a final duration shows after the call settles."
			class="!min-h-[200px] p-4"
			code={`<script lang="ts">
  import { magnifyingGlassIcon } from 'entasis/icons/magnifyingGlass';
${'</' + 'script>'}

<AITool
  tool={{
    name: 'web_search',
    title: 'Searched the web',
    icon: magnifyingGlassIcon,
    input: { query: 'svelte 5 attachments' },
    output: [{ title: 'Attachments', url: 'https://svelte.dev/docs/svelte/@attach' }],
    duration: 2300
  }}
/>`}
		>
			<AITool tool={iconTool} />
		</ComponentCard>

		<ComponentCard
			title="Failure"
			description="An error infers the failure status when no explicit status is provided."
			class="!min-h-[240px] p-4"
			code={`<script lang="ts">
  const failedTool = {
    name: 'deploy',
    title: 'Deploy preview',
    error: new Error('Deployment was rejected')
  };
${'</' + 'script>'}

<AITool tool={failedTool} />`}
		>
			<AITool tool={failedTool} />
		</ComponentCard>

		<ComponentCard
			title="Section composition"
			description="Override one semantic section while preserving the accordion, inferred status, and remaining default sections."
			class="!min-h-[260px] p-4"
			code={`<script lang="ts">
  const analysisTool = {
    name: 'analyze_release',
    input: { branch: 'main' },
    output: { score: 92, blockers: 0 }
  };
${'</' + 'script>'}

<AITool tool={analysisTool}>
  {#snippet output({ tool })}
    <div class="flex items-center justify-between gap-4 p-3 text-sm">
      <span class="text-neutral/70">Release score</span>
      <strong>{String((tool.output as { score?: number }).score ?? 'n/a')}</strong>
    </div>
  {/snippet}
</AITool>`}
		>
			<AITool tool={analysisTool}>
				{#snippet output({ tool })}
					<div class="flex items-center justify-between gap-4 p-3 text-sm">
						<span class="text-neutral/70">Release score</span>
						<strong>{String((tool.output as { score?: number }).score ?? 'n/a')}</strong>
					</div>
				{/snippet}
			</AITool>
		</ComponentCard>
	{/snippet}
</DocPage>
