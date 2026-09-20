<script lang="ts">
	import AITool from '$lib/components/AITool/AITool.svelte';
	import type {
		AIToolCall,
		AIToolToggleIcon,
		AIToolVariant
	} from '$lib/components/AITool/aiTool.props.js';
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
			options: ['running', 'success', 'error']
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
	const toolCalls = $derived<AIToolCall[]>([
		{
			id: 'search',
			name: 'search_docs',
			title: 'Search docs',
			input: { query: 'launch risk' },
			output: { matches: 3 }
		},
		{
			id: 'read',
			name: 'read_resource',
			title: 'Read launch plan',
			status: controls.value.status,
			input: { uri: 'docs://launch-plan' },
			output: circular,
			error:
				controls.value.status === 'error'
					? new Error('The launch plan could not be read.')
					: undefined
		}
	]);
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
		'Single-call and aggregate group composition',
		'Bindable expansion state',
		'Inferred status and active spinner',
		'Input, output, structured content, and error sections',
		'Circular-safe value rendering',
		'Depth, entry, and viewport bounds'
	]}
>
	<ComponentCard
		{controls}
		description="Change the second call status and whether nested calls may remain open together. Errors replace retained output, and circular values stay bounded."
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
  const toolCalls = $derived<AIToolCall[]>([
    {
      id: 'search',
      name: 'search_docs',
      title: 'Search docs',
      input: { query: 'launch risk' },
      output: { matches: 3 }
    },
    {
      id: 'read',
      name: 'read_resource',
      title: 'Read launch plan',
      status,
      input: { uri: 'docs://launch-plan' },
      output: circular,
      error: status === 'error' ? new Error('The launch plan could not be read.') : undefined
    }
  ]);
${'</' + 'script>'}

<AITool tools={toolCalls} bind:value={openTools} {multiple} {variant} {toggleIcon} aria-label="Tool calls" />`}
	>
		<AITool
			tools={toolCalls}
			bind:value={openTools}
			{multiple}
			{variant}
			{toggleIcon}
			aria-label="Tool calls"
			class="w-full max-w-3xl"
		/>
	</ComponentCard>

	{#snippet examples()}
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
			<AITool tool={failedTool} class="w-full max-w-2xl" />
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
			<AITool tool={analysisTool} class="w-full max-w-2xl">
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
