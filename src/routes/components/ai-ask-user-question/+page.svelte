<script lang="ts">
	import AIAskUserQuestion from '$lib/components/AIAskUserQuestion/AIAskUserQuestion.svelte';
	import type {
		AIAskAnswers,
		AIAskQuestion,
		AIAskUserQuestionSubmitPayload
	} from '$lib/components/AIAskUserQuestion/aiAskUserQuestion.props.js';
	import TextArea from '$lib/components/Form/TextArea/TextArea.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const questions: AIAskQuestion[] = [
		{
			id: 'release',
			type: 'single',
			title: 'Which release is this for?',
			required: true,
			options: [
				{ id: 'beta', label: 'Private beta', description: 'Invited customers only.' },
				{ id: 'ga', label: 'General availability', description: 'Public production launch.' }
			]
		},
		{
			id: 'checks',
			type: 'multiple',
			title: 'Which checks are required?',
			options: [
				{ id: 'a11y', label: 'Accessibility' },
				{ id: 'security', label: 'Security' },
				{ id: 'performance', label: 'Performance' }
			]
		},
		{
			id: 'notes',
			type: 'text',
			title: 'Anything else the model should know?',
			placeholder: 'Add constraints or context...'
		},
		{
			id: 'files',
			type: 'file',
			title: 'Attach supporting material',
			accept: ['image/*', '.pdf'],
			multiple: true,
			maxFiles: 3
		}
	];
	let answers = $state<AIAskAnswers>({});
	let submitted = $state<AIAskUserQuestionSubmitPayload>();
	const controls = createComponentControls([
		{
			name: 'question',
			type: 'segmented',
			label: 'Question',
			value: 'single',
			options: ['single', 'multiple', 'text', 'file']
		},
		{
			name: 'flowState',
			type: 'segmented',
			label: 'State',
			value: 'ready',
			options: ['ready', 'submitting', 'disabled']
		}
	]);
	const activeIndex = $derived(
		['single', 'multiple', 'text', 'file'].indexOf(controls.value.question)
	);
</script>

<DocPage
	title="AI Ask User Question"
	subtitle="A validated multi-step question flow for tool calls that require structured human input."
	component="AIAskUserQuestion"
	features={[
		'Text, single, multiple, and file questions',
		'Valibot schemas and exported value types',
		'Required-answer validation',
		'Optional automatic advance',
		'Bindable answers and active step',
		'Explicit async submission errors'
	]}
>
	<ComponentCard
		{controls}
		description="The flow composes existing form primitives and returns answers keyed by question id."
		class="!min-h-0 p-4"
		code={`<script lang="ts">
  import { AIAskUserQuestion } from 'svelai/ai-ask-user-question';
${'</' + 'script>'}

<AIAskUserQuestion
  {questions}
  bind:value={answers}
  onSubmit={({ answers }) => resolveTool(answers)}
/>`}
	>
		<div class="grid w-full max-w-2xl gap-4">
			<AIAskUserQuestion
				{questions}
				{activeIndex}
				autoAdvance={false}
				submitting={controls.value.flowState === 'submitting'}
				disabled={controls.value.flowState === 'disabled'}
				bind:value={answers}
				onSubmit={(detail) => {
					submitted = detail;
				}}
			/>
			{#if submitted}
				<pre
					class="border-neutral-muted max-h-32 overflow-auto rounded border p-3 text-xs">{JSON.stringify(
						submitted,
						null,
						2
					)}</pre>
			{/if}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Empty"
			description="An empty question set renders the existing Empty primitive with an overridable label."
			class="!min-h-[240px]"
			code={`<AIAskUserQuestion questions={[]} emptyLabel="No clarification needed" />`}
		>
			<AIAskUserQuestion questions={[]} emptyLabel="No clarification needed" />
		</ComponentCard>

		<ComponentCard
			title="Custom question"
			description="The question snippet receives the current answer and a setter, while the component retains validation, navigation, and submission."
			class="!min-h-[280px] p-4"
			code={`<AIAskUserQuestion {questions}>
  {#snippet question({ question, value, setValue })}
    <TextArea
      label={question.title}
      value={typeof value === 'string' ? value : ''}
      onValueChange={(value) => setValue(value ?? '')}
    />
  {/snippet}
</AIAskUserQuestion>`}
		>
			<AIAskUserQuestion
				questions={[{ id: 'custom', type: 'text', title: 'Custom rendered answer' }]}
				class="w-full max-w-2xl"
			>
				{#snippet question({ question, value, setValue })}
					<TextArea
						label={question.title}
						value={typeof value === 'string' ? value : ''}
						onValueChange={(nextValue) => setValue(nextValue ?? '')}
					/>
				{/snippet}
			</AIAskUserQuestion>
		</ComponentCard>

		<ComponentCard
			title="Visible async failure"
			description="Rejected submit and discard callbacks render in the flow and keep the current answers available for retry."
			class="!min-h-[280px] p-4"
			code={`<AIAskUserQuestion
  questions={[{
    id: 'confirmation',
    title: 'Confirm the request',
    required: false
  }]}
  onSubmit={async () => {
    throw new Error('The tool call could not be completed.');
  }}
/>`}
		>
			<AIAskUserQuestion
				questions={[
					{
						id: 'confirmation',
						title: 'Confirm the request',
						description: 'Submit to inspect the retained error state.',
						required: false
					}
				]}
				class="w-full max-w-2xl"
				onSubmit={async () => {
					throw new Error('The tool call could not be completed.');
				}}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
