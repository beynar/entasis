<script lang="ts">
	import AIChat from '$lib/components/AIChat/AIChat.svelte';
	import AIChatSkeleton from '$lib/components/AIChat/AIChatSkeleton.svelte';
	import AIComposer from '$lib/components/AIComposer/AIComposer.svelte';
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIThread from '$lib/components/AIThread/AIThread.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import AIChatDemo from './AIChatDemo.svelte';

	const controls = createComponentControls([
		{
			name: 'previewState',
			type: 'segmented',
			label: 'State',
			value: 'ready',
			options: ['ready', 'loading', 'error']
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
	const skeletonControls = createComponentControls([
		{
			name: 'layout',
			type: 'segmented',
			label: 'Skeleton',
			value: 'thread',
			options: ['thread', 'header', 'full']
		}
	]);
	let directMessages = $state([
		{ id: 'direct-user', role: 'user', content: 'Tune the primitives directly.' },
		{
			id: 'direct-assistant',
			role: 'assistant',
			content: 'AIChat stays opinionated; direct composition exposes each primitive.'
		}
	]);
</script>

<DocPage
	title="AI Chat"
	subtitle="An opinionated conversation surface assembled from the AI provider, transcript, composer, suggestions, and controls."
	component="AIChat"
	relatedComponents={['AIChatSkeleton']}
	features={[
		'Central conversation-state payloads',
		'Transcript density, message size, and presentation controls',
		'Before, after, context, and model regions',
		'Message actions and transcript navigation',
		'Product-level composer sources, files, and queueing',
		'Composer-level question requests',
		'Native-attribute skeleton states'
	]}
>
	<ComponentCard
		{controls}
		description="AIChat connects product-level controls to one conversation state while retaining regional replacement snippets."
		class="!min-h-0 p-3 sm:p-6"
		code={`<script lang="ts">
  import { AIChat } from 'svelai/ai-chat';
${'</' + 'script>'}

<AIChat
  bind:messages
  bind:selectedModel
  {models}
  {contextUsage}
  {suggestions}
  density="normal"
  messageSize="normal"
  messageVariant="minimal"
  showToc
  messageActionsVisibility="hover"
  fileDropzone
  onSubmit={sendMessage}
  onStop={stopGeneration}
/>`}
	>
		{#if controls.value.previewState === 'ready'}
			<AIChatDemo
				density={controls.value.density}
				messageSize={controls.value.messageSize}
				messageVariant={controls.value.messageVariant}
			/>
		{:else if controls.value.previewState === 'loading'}
			<AIChatSkeleton class="h-[520px] w-full" />
		{:else}
			<AIChat
				error={new Error('The model provider is unavailable.')}
				density={controls.value.density}
				messageSize={controls.value.messageSize}
				messageVariant={controls.value.messageVariant}
				class="h-[520px] w-full"
			/>
		{/if}
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Regional composition"
			description="Every product-level region receives the same AIConversationState instance, including its mutation methods."
			class="!min-h-0 p-3 sm:p-6"
			code={`<script lang="ts">
  import { AIChat } from 'svelai/ai-chat';
${'</' + 'script>'}

<AIChat {messages}>
  {#snippet beforeThread(state)}
	<div>{state.status}</div>
  {/snippet}
  {#snippet context(state)}
	<span>{state.contextUsage?.totalTokens ?? 0} tokens</span>
  {/snippet}
  {#snippet afterThread(state)}
	<div>{state.messages.length} messages</div>
  {/snippet}
</AIChat>`}
		>
			<AIChat
				messages={[
					{ id: 'user', role: 'user', content: 'Show the compact transcript.' },
					{ id: 'assistant', role: 'assistant', content: 'This region is application-owned.' }
				]}
				contextUsage={{ totalTokens: 8_420 }}
				class="h-[420px] w-full"
			>
				{#snippet beforeThread(state)}
					<div class="border-neutral-muted text-neutral/65 border-b px-4 py-2 text-xs">
						{state.status} · {state.messages.length} messages
					</div>
				{/snippet}
				{#snippet context(state)}
					<span class="text-neutral/65 text-xs">{state.contextUsage?.totalTokens ?? 0} tokens</span>
				{/snippet}
				{#snippet afterThread(state)}
					<div class="border-neutral-muted text-neutral/65 border-t px-4 py-2 text-xs">
						Latest role: {state.messages.at(-1)?.role ?? 'none'}
					</div>
				{/snippet}
			</AIChat>
		</ComponentCard>

		<ComponentCard
			title="Thread controls"
			description="Message actions and the user-turn table of contents are forwarded to the default AIThread."
			class="!min-h-0 p-3 sm:p-6"
			code={`<AIChat
  {messages}
  density="compact"
  messageSize="small"
  messageVariant="minimal"
  showToc
  tocSide="right"
  messageActionsVisibility="always"
  messageEditable={false}
  onMessageCopy={recordCopy}
/>`}
		>
			<AIChat
				messages={[
					{ id: 'question', role: 'user', content: 'Summarize the release decision.' },
					{
						id: 'answer',
						role: 'assistant',
						content: 'The private beta remains gated until the rollback drill passes.'
					}
				]}
				density="compact"
				messageSize="small"
				messageVariant="minimal"
				showToc
				messageActionsVisibility="always"
				messageEditable={false}
				class="h-[420px] w-full"
			/>
		</ComponentCard>

		<ComponentCard
			title="Primitive composition"
			description="Use AIConversation with AIThread and AIComposer for transcript or editor tuning that AIChat deliberately does not proxy."
			class="!min-h-0 p-3 sm:p-6"
			code={`<AIConversation bind:messages onSubmit={sendMessage}>
  <AIThread estimateSize={120} overscan={8} />
	  <AIComposer toolbar="fixed" submitShortcut="command-enter" />
</AIConversation>`}
		>
			<div class="grid h-[420px] w-full grid-rows-[minmax(0,1fr)_auto] gap-3">
				<AIConversation bind:messages={directMessages}>
					<AIThread
						estimateSize={120}
						overscan={8}
						class="border-neutral-muted rounded-lg border"
					/>
					<AIComposer toolbar="fixed" submitShortcut="command-enter" />
				</AIConversation>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Configurable skeleton"
			description="The skeleton forwards native div attributes and keeps a status role while its visible regions change."
			controls={skeletonControls}
			class="!min-h-0 p-3 sm:p-6"
			code={`<AIChatSkeleton
  messageCount={6}
  showHeader
  showFooter
  aria-label="Loading support conversation"
/>`}
		>
			<AIChatSkeleton
				messageCount={6}
				showHeader={skeletonControls.value.layout === 'header' ||
					skeletonControls.value.layout === 'full'}
				showComposer={skeletonControls.value.layout !== 'thread'}
				showFooter={skeletonControls.value.layout === 'full'}
				aria-label={`Loading ${skeletonControls.value.layout} chat layout`}
				class="h-[460px] w-full"
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
