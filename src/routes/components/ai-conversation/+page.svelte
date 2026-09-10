<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import AIComposer from '$lib/components/AIComposer/AIComposer.svelte';
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import type { AIConversationState } from '$lib/components/AIConversation/aiConversation.state.svelte.js';
	import AIThread from '$lib/components/AIThread/AIThread.svelte';
	import type { AIThreadItem } from '$lib/components/AIThread/aiThread.props.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	let conversation = $state<AIConversationState<AIThreadItem>>();
	let messages = $state<AIThreadItem[]>([
		{ id: 'welcome', role: 'assistant', content: 'Conversation state is scoped to these children.' }
	]);
	const controls = createComponentControls([
		{
			name: 'status',
			type: 'segmented',
			label: 'Lifecycle',
			value: 'idle',
			options: ['idle', 'queued', 'asking-user', 'streaming', 'stopping', 'error']
		}
	]);
	const methodGroups = [
		{
			label: 'Messages and tools',
			methods: [
				['appendMessage(message)', 'Appends and returns the message.'],
				['prependMessage(message)', 'Prepends and returns the message.'],
				['updateMessage(target, update)', 'Replaces one exact message and returns it.'],
				['removeMessage(target)', 'Removes one exact message and returns it.'],
				[
					'updateTool(messageTarget, toolTarget, update)',
					'Updates one exact tool call and returns it.'
				]
			]
		},
		{
			label: 'Shared values',
			methods: [
				['setInput(value)', 'Updates the shared composer input.'],
				['setFiles(files)', 'Updates selected files.'],
				['setAttachments(attachments)', 'Updates composer attachment records.'],
				['setSelectedModel(model)', 'Updates the selected model id.'],
				['setLiveText(value)', 'Updates uncommitted streamed assistant text.'],
				['setSuggestions(suggestions)', 'Updates empty-state prompt suggestions.'],
				['updateContextUsage(update)', 'Replaces or derives context-window usage.']
			]
		},
		{
			label: 'Queue and lifecycle',
			methods: [
				['setQueuedMessage(message)', 'Sets or clears the queued transcript message.'],
				['queueMessage(message)', 'Clears an error and queues a message.'],
				[
					'submitMessage(message, detail?)',
					'Commits, invokes onSubmit, and returns the message synchronously.'
				],
				['commitQueuedMessage()', 'Commits and returns the queued message.'],
				['discardQueuedMessage()', 'Discards and returns the queued message.'],
				['startStreaming()', 'Clears an error, starts streaming, and returns true.'],
				['stopStreaming()', 'Stops streaming and returns false.'],
				['requestStop()', 'Enters stopping, invokes onStop, and returns status synchronously.'],
				[
					'retry(target?)',
					'Clears an error, invokes onRetry, and returns the target synchronously.'
				],
				['setError(error)', 'Stops streaming and enters the error state.'],
				['clearError()', 'Clears and returns the previous error.']
			]
		},
		{
			label: 'Ask user question',
			methods: [
				[
					'setActiveAskUserQuestion(request)',
					'Sets or clears the active request and synchronizes status.'
				],
				[
					'resolveAskUserQuestion(state, detail?, request?)',
					'Persists the tool result, clears the matching request, and awaits its callback.'
				]
			]
		}
	] as const;

	function appendSystemMessage(): void {
		conversation?.appendMessage({
			id: crypto.randomUUID(),
			role: 'system',
			content: 'A system event was added through the strict mutation API.'
		});
	}
</script>

<DocPage
	title="AI Conversation"
	subtitle="Scoped, bindable AI state with strict message and tool mutations and no transport assumptions."
	component="AIConversation"
	features={[
		'Idle, queued, asking, streaming, stopping, and error states',
		'Immutable message and tool updates',
		'Bindable product state',
		'Observable lifecycle callbacks',
		'Explicit failures for missing or ambiguous targets',
		'No built-in network transport'
	]}
>
	<ComponentCard
		{controls}
		description="Children read the nearest conversation automatically. The buttons mutate the same bindable state exposed to the parent."
		class="!min-h-0 p-4"
		code={`<script lang="ts">
  import { AIConversation } from 'svelai/ai-conversation';
  import { AIThread } from 'svelai/ai-thread';
  import { AIComposer } from 'svelai/ai-composer';
${'</' + 'script>'}

<AIConversation bind:conversation bind:messages onSubmit={sendMessage}>
  <AIThread />
  <AIComposer />
</AIConversation>`}
	>
		<div class="grid h-[520px] w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
			<div class="flex items-center justify-between gap-3">
				<span class="text-sm text-neutral/65"
					>Status: {conversation?.status ?? 'initializing'}</span
				>
				<Button size="small" variant="outline" onclick={appendSystemMessage}>Append event</Button>
			</div>
			<AIConversation bind:conversation bind:messages bind:status={controls.value.status}>
				<AIThread class="rounded-lg border border-neutral-muted" />
				<AIComposer />
			</AIConversation>
		</div>
	</ComponentCard>

	<section aria-labelledby="conversation-methods" class="grid gap-5">
		<div>
			<h2 id="conversation-methods" class="text-xl font-semibold text-neutral">State methods</h2>
			<p class="mt-1 text-sm text-neutral/65">
				Message and tool targets must resolve exactly one item. Missing or ambiguous targets throw.
			</p>
		</div>
		{#each methodGroups as group (group.label)}
			<div class="overflow-hidden rounded-lg border border-neutral-muted">
				<div
					class="border-b border-neutral-muted bg-neutral-muted/25 px-4 py-2 text-sm font-semibold"
				>
					{group.label}
				</div>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[640px] text-left text-sm">
						<tbody class="divide-y divide-neutral-muted">
							{#each group.methods as method (method[0])}
								<tr>
									<td class="w-[46%] px-4 py-3 align-top"
										><code class="text-xs text-primary">{method[0]}</code></td
									>
									<td class="px-4 py-3 text-neutral/70">{method[1]}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/each}
	</section>

	{#snippet examples()}
		<ComponentCard
			title="Explicit failure"
			description="Mutation targets throw when they do not resolve exactly one message or tool; callers decide how to surface the failure."
			class="!min-h-fit"
			code={`try {
  conversation.updateMessage({ id: 'missing' }, { content: 'Updated' });
} catch (error) {
  // Surface the missing target at your application boundary.
}`}
			language="typescript"
		>
			<p class="max-w-xl text-sm text-neutral/70">
				The state object never reports a successful mutation when the requested target was not
				changed.
			</p>
		</ComponentCard>
	{/snippet}
</DocPage>
