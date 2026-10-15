<script lang="ts">
	import AIReasoning from '$lib/components/AIReasoning/AIReasoning.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const content = [
		'I should compare the requested behavior with the existing state contract, then preserve the smallest compatible public surface.',
		'The open state already has a bindable value and a default, so the stream lifecycle only needs to request changes through the same setter.',
		'Measured durations round to whole seconds; anything under half a second reads as less than a second rather than an endless shimmer.',
		'Finally, the trigger keeps one width while labels cycle, so the chevron never moves under the pointer.'
	].join('\n\n');
	const thinkingMessages = ['Planning', 'Checking constraints', 'Preparing response'];
	const reasoningLabels = {
		thinking: 'Working',
		thoughtForFewSeconds: 'Completed quickly',
		duration: (seconds: number) => 'Completed in ' + seconds + 's'
	};
	const mainCode = `<script lang="ts">
  import { AIReasoning } from 'entasis/ai-reasoning';

  let streaming = $state(true);
  const thinkingMessages = ['Planning', 'Checking constraints', 'Preparing response'];
${'</' + 'script>'}

<AIReasoning {content} {streaming} {thinkingMessages} />`;
	const exampleOptions = [
		{ value: 'duration', label: 'Duration' },
		{ value: 'opt-out', label: 'Auto-open off' },
		{ value: 'controlled', label: 'Controlled' },
		{ value: 'custom', label: 'Custom slots' },
		{ value: 'labels', label: 'Labels' }
	] as const;
	const examples = {
		duration: {
			title: 'Known duration',
			description:
				'Completed traces accept an explicit duration in seconds: 0 reads "less than a second", a minute or more reads "1m 12s".',
			code: `<AIReasoning {content} duration={72} defaultOpen />`
		},
		'opt-out': {
			title: 'Auto-open opt-out',
			description: 'defaultOpen=false keeps a streaming trace closed until the user opens it.',
			code: `<AIReasoning {content} streaming defaultOpen={false} />`
		},
		controlled: {
			title: 'Controlled state',
			description: 'Bind open and observe user toggles through onOpenChange.',
			code: `<AIReasoning {content} duration={8} bind:open onOpenChange={handleOpenChange} />`
		},
		custom: {
			title: 'Custom trigger and body',
			description: 'The custom trigger replaces the default row and receives the current message.',
			code: `<AIReasoning streaming thinkingMessages={['Planning', 'Checking constraints']}>
  {#snippet trigger({ message, open })}
    <span>{message} · {open ? 'Hide' : 'Show'}</span>
  {/snippet}
  {#snippet children({ message })}
    <p>Current step: {message}</p>
  {/snippet}
</AIReasoning>`
		},
		labels: {
			title: 'Custom labels',
			description:
				'Override the default streaming, unknown-duration, and duration-dependent copy together.',
			code: `<AIReasoning
  {content}
  duration={8}
  defaultOpen
  labels={{
    thinking: 'Working',
    thoughtForFewSeconds: 'Completed quickly',
    duration: (seconds) => 'Completed in ' + seconds + 's'
  }}
/>`
		}
	} as const;

	const controls = createComponentControls([
		{
			name: 'mode',
			type: 'segmented',
			label: 'State',
			value: 'streaming',
			options: ['streaming', 'completed']
		}
	]);
	const exampleControls = createComponentControls([
		{
			name: 'example',
			type: 'segmented',
			label: 'Variant',
			value: 'duration',
			options: exampleOptions
		},
		{
			name: 'seconds',
			type: 'segmented',
			label: 'Seconds',
			value: '8',
			options: ['0', '8', '72'],
			visible: (value) => value.example === 'duration'
		},
		{
			name: 'controlledMode',
			type: 'segmented',
			label: 'Open',
			value: 'open',
			options: ['open', 'closed'],
			visible: (value) => value.example === 'controlled'
		}
	]);
	let controlledOpen = $derived(exampleControls.value.controlledMode === 'open');
	const streaming = $derived(controls.value.mode === 'streaming');
	const selectedExample = $derived(examples[exampleControls.value.example]);

	function handleControlledOpenChange(nextOpen: boolean) {
		controlledOpen = nextOpen;
		exampleControls.value.controlledMode = nextOpen ? 'open' : 'closed';
	}
</script>

<DocPage
	title="AI Reasoning"
	subtitle="Streaming-aware collapsible reasoning with elapsed duration and cycling progress labels."
	component="AIReasoning"
	features={[
		'Optional Markdown or custom content',
		'Seconds-based controlled or measured duration',
		'Per-stream auto-open and one-time completion close',
		'Controlled and bindable open state',
		'Live elapsed time while streaming ("Thinking… · 6s")',
		'Bounded streaming window that follows the latest lines',
		{
			label: 'Steady-width cycling labels with a clean accessible name',
			test: 'a11y:ai-reasoning.accessible-name'
		},
		'Overridable status and duration labels',
		'Custom trigger with live state payload'
	]}
>
	<ComponentCard
		{controls}
		description="While streaming, the trigger counts the elapsed seconds and the body follows the newest lines in a bounded window. Switch to completed to measure the stream and exercise the 1000ms delayed close."
		class="!min-h-[280px]"
		code={mainCode}
	>
		<AIReasoning {content} {streaming} {thinkingMessages} class="w-full max-w-2xl" />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			controls={exampleControls}
			title={selectedExample.title}
			description={selectedExample.description}
			class="!min-h-[260px]"
			code={selectedExample.code}
		>
			{#if exampleControls.value.example === 'duration'}
				<AIReasoning
					{content}
					duration={Number(exampleControls.value.seconds)}
					defaultOpen
					class="w-full max-w-2xl"
				/>
			{:else if exampleControls.value.example === 'opt-out'}
				<AIReasoning {content} streaming defaultOpen={false} class="w-full max-w-2xl" />
			{:else if exampleControls.value.example === 'controlled'}
				<AIReasoning
					{content}
					duration={8}
					bind:open={controlledOpen}
					onOpenChange={handleControlledOpenChange}
					class="w-full max-w-2xl"
				/>
			{:else if exampleControls.value.example === 'custom'}
				<AIReasoning
					streaming
					thinkingMessages={['Planning', 'Checking constraints']}
					class="w-full max-w-2xl"
				>
					{#snippet trigger({ message, open })}
						<span class="flex w-full items-center justify-between gap-3 font-medium">
							<span>{message}</span>
							<span class="text-neutral/65 text-xs">{open ? 'Hide' : 'Show'}</span>
						</span>
					{/snippet}
					{#snippet children({ message })}
						<p class="text-sm leading-6">Current step: {message}</p>
					{/snippet}
				</AIReasoning>
			{:else}
				<AIReasoning
					{content}
					duration={8}
					defaultOpen
					labels={reasoningLabels}
					class="w-full max-w-2xl"
				/>
			{/if}
		</ComponentCard>
	{/snippet}
</DocPage>
