<script lang="ts">
	import { onDestroy } from 'svelte';
	import Alert from '$lib/components/Alert/Alert.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import AIChat from '$lib/components/AIChat/AIChat.svelte';
	import AIMessage from '$lib/components/AIMessage/AIMessage.svelte';
	import type {
		AIMessageSize,
		AIMessageVariant
	} from '$lib/components/AIMessage/aiMessage.props.js';
	import AIReasoning from '$lib/components/AIReasoning/Reasoning.svelte';
	import type { AIConversationState } from '$lib/components/AIConversation/aiConversation.state.svelte.js';
	import type { AIThreadDensity, AIThreadItem } from '$lib/components/AIThread/aiThread.props.js';
	import type { AIToolCall } from '$lib/components/AITool/aiTool.props.js';

	type DemoMessage = AIThreadItem & { reasoning?: string };
	let {
		density = 'normal',
		messageSize = 'normal',
		messageVariant = 'bubble'
	}: {
		density?: AIThreadDensity;
		messageSize?: AIMessageSize;
		messageVariant?: AIMessageVariant;
	} = $props();

	const models = [
		{ id: 'fast', label: 'Swift', provider: 'Svelai', contextWindow: 128_000 },
		{ id: 'deep', label: 'Deep', provider: 'Svelai', contextWindow: 256_000 }
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
	const initialTools: AIToolCall[] = [
		{
			id: 'search-1',
			name: 'search_docs',
			title: 'Search documentation',
			status: 'success',
			input: { query: 'release checklist' },
			output: { matches: 4, source: 'launch-brief.md' }
		},
		{
			id: 'tasks-1',
			name: 'list_tasks',
			title: 'Read launch tasks',
			status: 'success',
			input: { status: 'open' },
			output: ['Finalize copy', 'Run accessibility review']
		}
	];

	let conversation = $state<AIConversationState<DemoMessage>>();
	let messages = $state<DemoMessage[]>([
		{
			id: 'user-1',
			role: 'user',
			content: 'Turn the launch brief into a concise release checklist.',
			files: [{ name: 'launch-brief.md', size: 18_420, type: 'text/markdown' }]
		},
		{
			id: 'assistant-1',
			role: 'assistant',
			reasoning:
				'I should identify the release gates, owners, and remaining risks before drafting.',
			content: 'I found the core release gates and checked the open work.'
		},
		{ id: 'tools-1', role: 'tool', tools: initialTools },
		{
			id: 'assistant-2',
			role: 'assistant',
			content:
				'### Release checklist\n\n- Finalize product copy\n- Complete accessibility review\n- Verify rollback ownership\n- Confirm launch metrics'
		}
	]);
	let selectedModel = $state('fast');
	let contextUsage = $state({ inputTokens: 18_240, outputTokens: 2_180, reasoningTokens: 920 });
	let suggestions = $state(['Add owners', 'Identify launch risks', 'Draft release notes']);
	let responseTimer: ReturnType<typeof setTimeout> | undefined;

	onDestroy(() => clearResponseTimer());

	async function handleSubmit({
		conversation: state
	}: {
		conversation: AIConversationState<DemoMessage>;
	}): Promise<void> {
		clearResponseTimer();
		state.startStreaming();
		state.setLiveText('Reviewing the request and current launch context...');
		responseTimer = setTimeout(() => {
			state.setLiveText(undefined);
			state.appendMessage({
				id: crypto.randomUUID(),
				role: 'assistant',
				content: 'I updated the checklist and kept the answer scoped to the launch brief.'
			});
			state.stopStreaming();
			responseTimer = undefined;
		}, 1_600);
	}

	function handleStop(state: AIConversationState<DemoMessage>): void {
		clearResponseTimer();
		state.setLiveText(undefined);
		state.stopStreaming();
	}

	function clearResponseTimer(): void {
		if (responseTimer === undefined) return;
		clearTimeout(responseTimer);
		responseTimer = undefined;
	}

	function askForInput(): void {
		if (!conversation) return;
		const toolId = crypto.randomUUID();
		const tool: AIToolCall = {
			id: toolId,
			name: 'ask_user_question',
			title: 'Confirm launch scope',
			status: 'running'
		};
		const message: DemoMessage = {
			id: crypto.randomUUID(),
			role: 'tool',
			tools: [tool]
		};
		conversation.appendMessage(message);
		conversation.setActiveAskUserQuestion({
			key: toolId,
			message,
			messageIndex: conversation.messages.length - 1,
			tool,
			toolIndex: 0,
			questions: [
				{
					id: 'scope',
					type: 'single',
					title: 'Which release should this checklist target?',
					required: true,
					options: [
						{ id: 'beta', label: 'Private beta', description: 'Internal and invited users.' },
						{ id: 'ga', label: 'General availability', description: 'Public production launch.' }
					]
				}
			]
		});
	}
</script>

<AIChat
	bind:conversation
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
				<div class="text-xs text-neutral/60">{state.messages.length} transcript items</div>
			</div>
			<Button size="small" variant="outline" onclick={askForInput}>Ask for input</Button>
		</div>
	{/snippet}
	{#snippet message({ message, index, actionsVisibility })}
		<div class="grid gap-2">
			{#if message.reasoning}
				<AIReasoning content={message.reasoning} duration={4} />
			{/if}
			<AIMessage
				{message}
				{index}
				size={messageSize}
				variant={messageVariant}
				{actionsVisibility}
			/>
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
			<div class="text-xs text-neutral/55">State: {state.status}</div>
		{/if}
	{/snippet}
</AIChat>
