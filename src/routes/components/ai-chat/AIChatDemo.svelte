<script lang="ts">
	import { onDestroy } from 'svelte';
	import Alert from '$lib/components/Alert/Alert.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import AIChat from '$lib/components/AIChat/AIChat.svelte';
	import type {
		AIMessageSize,
		AIMessageVariant
	} from '$lib/components/AIMessage/aiMessage.props.js';
	import type { AIConversationState } from '$lib/components/AIConversation/aiConversation.state.svelte.js';
	import type {
		AIThreadDensity,
		AIThreadItem,
		AIThreadMessageActionsVisibility,
		AIThreadPart
	} from '$lib/components/AIThread/aiThread.props.js';
	import type { AIToolCall } from '$lib/components/AITool/aiTool.props.js';
	import type { Colors } from '$lib/types/theme.js';

	let {
		density = 'normal',
		messageSize = 'normal',
		messageVariant = 'minimal',
		messageColor = 'neutral',
		messageActionsVisibility = 'latest'
	}: {
		density?: AIThreadDensity;
		messageSize?: AIMessageSize;
		messageVariant?: AIMessageVariant;
		messageColor?: Colors;
		messageActionsVisibility?: AIThreadMessageActionsVisibility;
	} = $props();

	const models = [
		{ id: 'fast', label: 'Swift', provider: 'Entasis', contextWindow: 128_000 },
		{ id: 'deep', label: 'Deep', provider: 'Entasis', contextWindow: 256_000 }
	];
	const commands = {
		items: [
			{ id: 'summarize', label: 'Summarize', description: 'Condense the current thread.' },
			{ id: 'plan', label: 'Plan', description: 'Create an implementation plan.' }
		]
	};
	const mentions = {
		items: [
			{ id: 'design', label: 'Design team', description: 'Mention the design team.' },
			{ id: 'platform', label: 'Platform team', description: 'Mention the platform team.' }
		]
	};
	const references = {
		items: [
			{
				id: 'brief',
				label: 'launch-brief.md',
				description: 'Launch requirements',
				path: 'docs/launch-brief.md'
			}
		]
	};
	const skills = {
		items: [{ id: 'review', label: 'Review', description: 'Review for regressions and omissions.' }]
	};
	const checklist = [
		'### Release checklist',
		'',
		'The launch is gated on three checks. Each one has an owner and a rollback path:',
		'',
		'1. **Finalize product copy** — marketing signs off in `launch-brief.md`, including the long tail of localized strings that ship with the release.',
		'2. **Complete the accessibility review** — keyboard and screen-reader passes on every new screen.',
		'3. **Verify rollback ownership** — the release controller owns the gate.',
		'',
		'| Gate | Owner | Status |',
		'| --- | --- | --- |',
		'| Copy | Marketing | Ready |',
		'| Accessibility | Design systems | In review |',
		'| Rollback drill | Platform | Scheduled |',
		'',
		'```bash',
		'pnpm release --dry-run --channel beta',
		'```'
	].join('\n');

	let conversation = $state<AIConversationState<AIThreadItem>>();
	let messages = $state<AIThreadItem[]>([
		{
			id: 'user-1',
			role: 'user',
			content: 'Turn the launch brief into a concise release checklist.',
			files: [{ name: 'launch-brief.md', size: 18_420, type: 'text/markdown' }]
		},
		{
			id: 'assistant-1',
			role: 'assistant',
			parts: [
				{
					type: 'reasoning',
					text: 'I should identify the release gates, owners, and remaining risks before drafting.',
					state: 'done'
				},
				{ type: 'text', text: 'I found the core release gates and checked the open work.' },
				{
					type: 'tool-search_docs',
					toolCallId: 'search-1',
					state: 'output-available',
					input: { query: 'release checklist' },
					output: { matches: 4, source: 'launch-brief.md' }
				},
				{
					type: 'tool-list_tasks',
					toolCallId: 'tasks-1',
					state: 'output-available',
					input: { status: 'open' },
					output: ['Finalize copy', 'Run accessibility review']
				},
				{ type: 'text', text: checklist },
				{
					type: 'source-url',
					sourceId: 'brief',
					url: 'https://example.com/docs/launch-brief',
					title: 'Launch brief'
				},
				{
					type: 'source-url',
					sourceId: 'runbook',
					url: 'https://example.com/runbooks/rollout'
				}
			]
		}
	]);
	let selectedModel = $state('fast');
	let contextUsage = $state({ inputTokens: 18_240, outputTokens: 2_180, reasoningTokens: 920 });
	let suggestions = $state(['Add owners', 'Identify launch risks', 'Draft release notes']);
	let timers: ReturnType<typeof setTimeout>[] = [];

	onDestroy(() => clearTimers());

	const replyWords =
		'I updated the checklist and kept the answer scoped to the launch brief. The rollback drill moves before the accessibility review, so the platform team can sign off first.'.split(
			' '
		);

	// Simulates a streamed reply: the pending row shows until the first part arrives, then the
	// reasoning streams, then the text grows word by word behind the caret.
	function handleSubmit({
		conversation: state
	}: {
		conversation: AIConversationState<AIThreadItem>;
	}): void {
		clearTimers();
		state.startStreaming();
		state.setLiveText(undefined);
		const id = crypto.randomUUID();
		const reasoning: AIThreadPart = {
			type: 'reasoning',
			text: 'Re-reading the brief and the open tasks.',
			state: 'streaming'
		};
		schedule(900, () => state.appendMessage({ id, role: 'assistant', parts: [reasoning] }));
		replyWords.forEach((_, index) => {
			schedule(1_800 + index * 90, () =>
				state.updateMessage({ id }, (message) => ({
					...message,
					parts: [
						{ ...reasoning, state: 'done' },
						{ type: 'text', text: replyWords.slice(0, index + 1).join(' ') }
					]
				}))
			);
		});
		schedule(1_900 + replyWords.length * 90, () => state.stopStreaming());
	}

	function handleStop(state: AIConversationState<AIThreadItem>): void {
		clearTimers();
		state.stopStreaming();
	}

	function schedule(delay: number, run: () => void): void {
		timers.push(setTimeout(run, delay));
	}

	function clearTimers(): void {
		for (const timer of timers) clearTimeout(timer);
		timers = [];
	}

	function askForInput(): void {
		if (!conversation) return;
		const toolId = crypto.randomUUID();
		const questions = [
			{
				id: 'scope',
				type: 'single' as const,
				title: 'Which release should this checklist target?',
				required: true,
				options: [
					{ id: 'beta', label: 'Private beta', description: 'Internal and invited users.' },
					{ id: 'ga', label: 'General availability', description: 'Public production launch.' }
				]
			}
		];
		const tool: AIToolCall = {
			id: toolId,
			name: 'ask_user_question',
			title: 'Confirm launch scope',
			status: 'running',
			input: { title: 'Confirm launch scope', questions }
		};
		const message: AIThreadItem = { id: crypto.randomUUID(), role: 'tool', tools: [tool] };
		conversation.appendMessage(message);
		conversation.setActiveAskUserQuestion({
			key: toolId,
			message,
			messageIndex: conversation.messages.length - 1,
			tool,
			toolIndex: 0,
			title: 'Confirm launch scope',
			questions
		});
	}
</script>

<AIChat
	bind:api={conversation}
	bind:messages
	bind:selectedModel
	bind:contextUsage
	bind:suggestions
	{models}
	{commands}
	{mentions}
	{references}
	{skills}
	{density}
	{messageSize}
	{messageVariant}
	{messageColor}
	{messageActionsVisibility}
	maxTokens={128_000}
	accept={['text/*', '.md', '.pdf']}
	onSubmit={handleSubmit}
	onStop={handleStop}
	class="h-[640px] w-full"
>
	{#snippet header(state)}
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<div class="text-sm font-semibold">Launch workspace</div>
				<div class="text-neutral/70 text-xs">{state.messages.length} transcript items</div>
			</div>
			<Button size="small" variant="outline" onclick={askForInput}>Ask for input</Button>
		</div>
	{/snippet}
	{#snippet footer(state)}
		{#if state.status === 'asking-user'}
			<Alert
				variant="soft"
				color="info"
				description="The conversation is waiting for a required answer."
			/>
		{:else}
			<div class="text-neutral/70 text-xs">State: {state.status}</div>
		{/if}
	{/snippet}
</AIChat>
