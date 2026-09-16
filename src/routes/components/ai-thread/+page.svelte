<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIThread from '$lib/components/AIThread/AIThread.svelte';
	import AIThreadToc from '$lib/components/AIThreadToc/AIThreadToc.svelte';
	import type {
		AIThreadAskUserQuestionStateChange,
		AIThreadItem,
		AIThreadTocEntry,
		AIThreadTocPinPayload,
		AIThreadTocState
	} from '$lib/components/AIThread/aiThread.props.js';
	import Button from '$lib/components/Button/Button.svelte';
	import { arrowCounterClockwiseIcon } from '$lib/components/Icons/arrowCounterClockwise.js';
	import { arrowDownIcon } from '$lib/components/Icons/arrowDown.js';
	import { arrowUpIcon } from '$lib/components/Icons/arrowUp.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const prompts = [
		'Summarize the migration risks.',
		'Which service owns the rollout gate?',
		'Compare the canary and blue-green paths.',
		'List the observability checks before launch.',
		'What would make rollback unsafe?',
		'Condense this into an operator checklist.'
	];
	const answers = [
		'The main risks are schema drift, mixed-version reads, and rollback incompatibility.',
		'The release controller owns the gate and records the final deployment decision.',
		'Canary limits exposure while blue-green gives a faster full-environment rollback.',
		'Check error rate, queue depth, saturation, and the migration checkpoint before promotion.',
		'Rollback is unsafe after irreversible writes or when the previous binary cannot read new data.',
		'Validate compatibility, deploy the canary, inspect telemetry, then promote or roll back.'
	];
	const completeHistory: AIThreadItem[] = Array.from({ length: 18 }, (_, turn): AIThreadItem[] => [
		{
			id: `user-${turn}`,
			role: 'user',
			content: prompts[turn % prompts.length],
			files:
				turn === 6
					? [
							{
								id: 'rollout-plan',
								name: 'rollout-plan.md',
								size: 18_420,
								type: 'text/markdown'
							},
							{
								id: 'service-map',
								name: 'service-map.png',
								size: 92_100,
								type: 'image/png'
							}
						]
					: undefined
		},
		{
			id: `assistant-${turn}`,
			role: 'assistant',
			content: answers[turn % answers.length]
		}
	]).flat();
	const partMessages: AIThreadItem[] = [
		{
			id: 'context-refresh',
			type: 'context',
			content: 'Repository context refreshed',
			markerVariant: 'separator'
		},
		{
			id: 'parts-user',
			role: 'user',
			content: 'Find the release policy and summarize the rollout gates.'
		},
		{
			id: 'parts-assistant',
			role: 'assistant',
			content: 'I found the policy and checked the rollout requirements.',
			parts: [
				{
					type: 'text',
					text: 'I found the policy and checked the rollout requirements.'
				},
				{
					type: 'tool-searchDocs',
					toolCallId: 'search-policy',
					state: 'output-available',
					input: { query: 'release policy rollout gate' },
					output: { matches: ['docs/release-policy.md', 'runbooks/rollout.md'] }
				},
				{
					type: 'dynamic-tool',
					toolName: 'summarizePolicy',
					toolCallId: 'summarize-policy',
					state: 'output-available',
					input: { documents: 2 },
					output: { gates: ['compatibility', 'telemetry', 'approval'] }
				}
			]
		}
	];
	const questionMessages: AIThreadItem[] = [
		{
			id: 'question-user',
			role: 'user',
			content: 'Prepare the production rollout.'
		},
		{
			id: 'question-assistant',
			role: 'assistant',
			content: 'I need one deployment decision before continuing.',
			parts: [
				{
					type: 'text',
					text: 'I need one deployment decision before continuing.'
				},
				{
					type: 'tool-askUserQuestion',
					toolCallId: 'choose-rollout',
					state: 'input-available',
					input: {
						title: 'Deployment approval',
						requester: 'Release agent',
						context: 'The rollout plan needs an explicit release strategy.',
						discardLabel: 'Decide later',
						questions: [
							{
								id: 'strategy',
								title: 'Which rollout strategy should be used?',
								type: 'single',
								required: true,
								options: [
									{ id: 'canary', label: 'Canary', description: 'Promote in stages.' },
									{
										id: 'blue-green',
										label: 'Blue-green',
										description: 'Switch complete environments.'
									}
								]
							},
							{
								id: 'guardrails',
								title: 'Add any promotion guardrails.',
								type: 'text',
								rows: 2
							}
						]
					}
				}
			]
		}
	];
	const providerSuggestions = ['Review rollout risks', 'Draft a release checklist'];
	const directSuggestions = ['Compare rollout strategies', 'Find rollback blockers'];

	const controls = createComponentControls([
		{
			name: 'mode',
			type: 'segmented',
			label: 'State',
			value: 'history',
			options: [
				{ value: 'history', label: 'History' },
				{ value: 'parts', label: 'AI SDK parts' },
				{ value: 'live', label: 'Live' },
				{ value: 'empty', label: 'Empty' },
				{ value: 'question', label: 'Question' }
			]
		},
		{
			name: 'scrollBehavior',
			type: 'segmented',
			label: 'Scroll',
			value: 'smooth',
			options: ['auto', 'smooth', 'instant']
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{
			name: 'messageSize',
			type: 'segmented',
			label: 'Message size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'messageVariant',
			type: 'segmented',
			label: 'Messages',
			value: 'bubble',
			options: ['bubble', 'minimal']
		}
	]);
	const tocControls = createComponentControls([
		{
			name: 'tocMode',
			type: 'segmented',
			label: 'Navigation',
			value: 'default',
			options: [
				{ value: 'default', label: 'Default' },
				{ value: 'custom', label: 'Custom' }
			]
		},
		{
			name: 'tocSide',
			type: 'segmented',
			label: 'Side',
			value: 'left',
			options: ['left', 'right']
		}
	]);
	const suggestionControls = createComponentControls([
		{
			name: 'suggestionSource',
			type: 'segmented',
			label: 'Suggestions',
			value: 'provider',
			options: [
				{ value: 'provider', label: 'Provider' },
				{ value: 'direct', label: 'Direct' }
			]
		}
	]);
	const mode = $derived(controls.value.mode);
	const scrollBehavior = $derived(controls.value.scrollBehavior);
	const density = $derived(controls.value.density);
	const messageSize = $derived(controls.value.messageSize);
	const messageVariant = $derived(controls.value.messageVariant);
	const tocMode = $derived(tocControls.value.tocMode);
	const tocSide = $derived(tocControls.value.tocSide);
	const suggestionSource = $derived(suggestionControls.value.suggestionSource);

	let historyStart = $state(12);
	let historyEnd = $state(30);
	let questionReset = $state(0);
	let questionResolution = $state('');
	let selectedSuggestion = $state('');

	const historyMessages = $derived(completeHistory.slice(historyStart, historyEnd));
	const displayedMessages = $derived(
		mode === 'empty'
			? []
			: mode === 'parts'
				? partMessages
				: mode === 'question'
					? questionMessages
					: historyMessages
	);
	const tocMessages = completeHistory.slice(0, 26);

	function getMessageKey(message: AIThreadItem) {
		return message.id;
	}

	function prependHistory(): void {
		historyStart = Math.max(0, historyStart - 4);
	}

	function appendHistory(): void {
		historyEnd = Math.min(completeHistory.length, historyEnd + 4);
	}

	function resetHistory(): void {
		historyStart = 12;
		historyEnd = 30;
	}

	function resetQuestion(): void {
		questionResolution = '';
		questionReset += 1;
	}

	function handleQuestionStateChange(
		change: AIThreadAskUserQuestionStateChange<AIThreadItem>
	): void {
		questionResolution = change.state;
	}

	function handleSuggestionSelect(suggestion: string): void {
		selectedSuggestion = suggestion;
	}
</script>

{#snippet customPin(payload: AIThreadTocPinPayload)}
	<span
		class={payload.active
			? 'bg-success block size-2 rounded-full'
			: 'bg-warning block size-1.5 rounded-sm'}
	></span>
{/snippet}

{#snippet customPreview(entry: AIThreadTocEntry)}
	<div class="grid max-w-64 gap-1 text-left">
		<strong class="truncate text-sm">{entry.title}</strong>
		{#if entry.excerpt}
			<p class="text-neutral/65 line-clamp-4 text-xs">{entry.excerpt}</p>
		{/if}
		{#if entry.fileCount > 0}
			<p class="text-neutral/65 text-xs">
				{entry.fileCount} attached {entry.fileCount === 1 ? 'file' : 'files'}
			</p>
		{/if}
	</div>
{/snippet}

{#snippet customToc(state: AIThreadTocState)}
	<AIThreadToc
		{state}
		maxPins={Math.max(4, Math.min(8, state.entries.length))}
		side={tocSide}
		previewAlign="start"
		pin={customPin}
		preview={customPreview}
		aria-label={`Conversation turns, active ${state.activeIndex === undefined ? 'none' : state.activeIndex + 1}`}
	/>
{/snippet}

<DocPage
	title="AI Thread"
	subtitle="A virtualized transcript with stable append following, prepend preservation, AI SDK tool parts, question flows, and user-turn navigation."
	component="AIThread"
	relatedComponents={['AIThreadToc', 'AIConversation', 'AIMessage', 'AITool']}
	features={[
		'TanStack virtualization with initial end anchoring',
		'Independent transcript density and message scale',
		'Bubble or minimal default message presentation',
		'Pinned append and same-row growth following',
		'Absolute-start and middle-position prepend preservation',
		'Context markers, AI SDK tool parts, and grouped tools',
		'Standalone question flows',
		'Scrollable transcript with TOC previews'
	]}
>
	<ComponentCard
		{controls}
		description="History exposes prepend, append, and stable message-key behavior. Live text is announced without becoming a transcript row; pending ask-user-question tool parts move into the standalone flow below the viewport."
		class="!min-h-0 p-4"
		code={`<script lang="ts">
  import { AIThread } from 'svelai/ai-thread';

  let threadRoot: HTMLDivElement;
${'</' + 'script>'}

<AIThread
  bind:ref={threadRoot}
  class="h-[32rem] rounded-lg border"
  {messages}
  getMessageKey={(message) => message.id}
  density="normal"
  messageSize="normal"
  messageVariant="minimal"
  scrollBehavior="smooth"
  showToc
/>`}
	>
		<div class="grid h-[560px] w-full grid-rows-[2rem_minmax(0,1fr)] gap-3">
			<div class="flex min-w-0 items-center gap-2" aria-live="polite">
				{#if mode === 'history'}
					<Button
						size="small"
						variant="outline"
						prefix={arrowUpIcon}
						disabled={historyStart === 0}
						onclick={prependHistory}>Prepend</Button
					>
					<Button
						size="small"
						variant="ghost"
						prefix={arrowCounterClockwiseIcon}
						onclick={resetHistory}>Reset</Button
					>
					<Button
						size="small"
						variant="outline"
						prefix={arrowDownIcon}
						disabled={historyEnd === completeHistory.length}
						onclick={appendHistory}>Append</Button
					>
				{:else if mode === 'question'}
					<Button
						size="small"
						variant="outline"
						prefix={arrowCounterClockwiseIcon}
						onclick={resetQuestion}>Reset question</Button
					>
					{#if questionResolution}
						<span class="text-neutral/70 text-xs">{questionResolution}</span>
					{/if}
				{/if}
			</div>
			{#key `${mode}:${questionReset}`}
				<AIThread
					messages={displayedMessages}
					{getMessageKey}
					{scrollBehavior}
					{density}
					{messageSize}
					{messageVariant}
					showToc={mode === 'history' || mode === 'parts'}
					liveText={mode === 'live' ? 'Assistant is drafting the next section.' : undefined}
					streaming={mode === 'live'}
					suggestions={mode === 'empty' ? directSuggestions : undefined}
					onSelect={handleSuggestionSelect}
					onAskUserQuestionStateChange={handleQuestionStateChange}
					class="border-neutral-muted rounded-lg border"
				/>
			{/key}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			controls={tocControls}
			title="TOC state and previews"
			description="The custom TOC receives measured entries, the visible range, active turn, and navigation callbacks. Focus any pin to open its HoverCard preview; Escape closes it."
			class="!min-h-0 p-4"
			code={`<script lang="ts">
  import { AIThread } from 'svelai/ai-thread';
  import { AIThreadToc, type AIThreadTocState } from 'svelai/ai-thread-toc';
${'</' + 'script>'}

{#snippet toc(state: AIThreadTocState)}
  <AIThreadToc
    {state}
    side={tocSide}
    pin={customPin}
    preview={customPreview}
  />
{/snippet}

<AIThread messages={messages} showToc {toc} />`}
		>
			<div class="h-[500px] w-full">
				<AIThread
					messages={tocMessages}
					{getMessageKey}
					showToc
					{tocSide}
					toc={tocMode === 'custom' ? customToc : undefined}
					class="border-neutral-muted h-full rounded-lg border"
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			controls={suggestionControls}
			title="Suggestion precedence"
			description="Direct suggestions replace provider suggestions when supplied. The explicit click callback runs before the conversation fallback that writes into composer input."
			class="!min-h-0 p-4"
			code={`<AIConversation suggestions={providerSuggestions}>
  <AIThread
    messages={[]}
    suggestions={directSuggestions}
    onSelect={handleSuggestionSelect}
  />
</AIConversation>`}
		>
			<div class="grid h-[360px] w-full grid-rows-[minmax(0,1fr)_1.5rem] gap-2">
				<AIConversation messages={[]} suggestions={providerSuggestions}>
					<AIThread
						messages={[]}
						suggestions={suggestionSource === 'direct' ? directSuggestions : undefined}
						onSelect={handleSuggestionSelect}
						class="border-neutral-muted rounded-lg border"
					/>
				</AIConversation>
				<p class="text-neutral/70 truncate text-center text-xs" aria-live="polite">
					{selectedSuggestion ? `Selected: ${selectedSuggestion}` : ''}
				</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
