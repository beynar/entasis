<script lang="ts">
	import { onDestroy } from 'svelte';
	import { dev } from '$app/environment';
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

	// Dev only: append one of each kind of transcript row, to check layout, spacing and scrolling.
	const longAnswer = [
		'## Release readiness',
		'',
		'The launch is **on track**, with two open items. Here is where each workstream stands and what still needs a decision before the beta opens to invited customers.',
		'',
		'### Open items',
		'',
		'1. Finalize the onboarding copy with the design team.',
		'2. Run the accessibility review on the new settings pages.',
		'3. Confirm the rollback drill owner for the platform team.',
		'',
		'| Workstream | Owner | Status |',
		'| --- | --- | --- |',
		'| Copy | Design | In review |',
		'| Accessibility | Platform | Scheduled |',
		'| Rollback drill | Platform | Done |',
		'',
		'```bash',
		'pnpm release --dry-run --channel beta',
		'```',
		'',
		'> Ship the beta once both reviews sign off; the general release follows a week later.',
		'',
		'Let me know if you want owners added to each step or a short summary for the announcement.'
	].join('\n');
	const longUserMessage =
		'Before we ship, can you double-check the whole plan? I want the rollback drill to happen before the accessibility review, the copy to be final by Thursday, and a short summary I can paste into the launch channel. Also flag anything that still has no owner, and tell me which of these items could slip without blocking the beta, because the design team is short-handed this week and I would rather move something than rush it.';

	function appendDemo(
		kind: 'user-short' | 'user-long' | 'answer-short' | 'answer-long' | 'thinking' | 'tool'
	): void {
		if (!conversation) return;
		const state = conversation;
		const id = crypto.randomUUID();
		if (kind === 'user-short' || kind === 'user-long') {
			state.appendMessage({
				id,
				role: 'user',
				content: kind === 'user-short' ? 'Looks good, ship it.' : longUserMessage
			});
			return;
		}
		if (kind === 'answer-short' || kind === 'answer-long') {
			state.appendMessage({
				id,
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: kind === 'answer-short' ? 'Done: the checklist is updated.' : longAnswer
					}
				]
			});
			return;
		}
		if (kind === 'thinking') {
			const text =
				'The user wants the rollback drill first. That moves the platform sign-off earlier, so the accessibility review shifts to Thursday. Copy can still land the same day.';
			state.appendMessage({
				id,
				role: 'assistant',
				parts: [{ type: 'reasoning', text: text.slice(0, 40), state: 'streaming' }]
			});
			schedule(700, () =>
				state.updateMessage({ id }, (message) => ({
					...message,
					parts: [{ type: 'reasoning', text, state: 'done' }]
				}))
			);
			return;
		}
		const toolCallId = crypto.randomUUID();
		const tool = (done: boolean): AIThreadPart => ({
			type: 'tool-list_tasks',
			toolCallId,
			state: done ? 'output-available' : 'input-available',
			input: { status: 'open', team: 'platform' },
			...(done ? { output: ['Rollback drill', 'Accessibility review'] } : {})
		});
		state.appendMessage({ id, role: 'assistant', parts: [tool(false)] });
		schedule(1_200, () =>
			state.updateMessage({ id }, (message) => ({ ...message, parts: [tool(true)] }))
		);
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
		{#if dev}
			<!-- Dev only (not on the published site): append each kind of row. -->
			<div class="mt-3 flex flex-wrap items-center gap-1.5">
				<span class="text-neutral/70 me-1 text-xs">Append</span>
				<Button size="small" variant="soft" onclick={() => appendDemo('user-short')}
					>User short</Button
				>
				<Button size="small" variant="soft" onclick={() => appendDemo('user-long')}
					>User long</Button
				>
				<Button size="small" variant="soft" onclick={() => appendDemo('answer-short')}
					>Answer short</Button
				>
				<Button size="small" variant="soft" onclick={() => appendDemo('answer-long')}
					>Answer long</Button
				>
				<Button size="small" variant="soft" onclick={() => appendDemo('thinking')}>Thinking</Button>
				<Button size="small" variant="soft" onclick={() => appendDemo('tool')}>Tool call</Button>
			</div>
		{/if}
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
