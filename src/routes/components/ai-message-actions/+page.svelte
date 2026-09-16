<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIMessageActions from '$lib/components/AIMessageActions/AIMessageActions.svelte';
	import type { AIMessageActionState } from '$lib/components/AIMessageActions/aiMessageActions.props.js';
	import Button from '$lib/components/Button/Button.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	let lastAction = $state('No action yet');
	let providerAction = $state('No provider action yet');
	const controls = createComponentControls([
		{
			name: 'role',
			type: 'segmented',
			label: 'Role defaults',
			value: 'assistant',
			options: ['assistant', 'user']
		},
		{
			name: 'visibility',
			type: 'segmented',
			label: 'Visibility',
			value: 'always',
			options: ['always', 'hover', 'none']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		}
	]);
	const providerMessage = {
		id: 'provider-answer',
		role: 'assistant' as const,
		content: 'Retry this response through the nearest conversation.'
	};
</script>

{#snippet customActions({ copied, copy, size }: AIMessageActionState)}
	<Button type="button" variant="ghost" {size} onclick={() => void copy()}>
		{copied ? 'Copied' : 'Copy answer'}
	</Button>
{/snippet}

<DocPage
	title="AI Message Actions"
	subtitle="A reusable copy, edit, retry, and custom-action surface for transcript messages."
	component="AIMessageActions"
	features={[
		'Clipboard integration',
		'Role-aware edit and retry defaults',
		'Small, normal, and large action scales',
		'Custom action snippet',
		'Accessible icon buttons',
		'Direct callbacks or conversation retry',
		'Bindable rendering through action state'
	]}
>
	<ComponentCard
		{controls}
		description="Copy, edit, and retry report through explicit callbacks. The custom snippet receives the same action methods."
		class="!min-h-[240px]"
		code={`<script lang="ts">
  import { AIMessageActions } from 'svelai/ai-message-actions';
${'</' + 'script>'}

<AIMessageActions
  role="assistant"
  content="A generated answer"
  size="normal"
  visibility="always"
  onRetry={({ content }) => regenerate(content)}
/>`}
	>
		<div class="grid justify-items-center gap-3">
			<AIMessageActions
				role={controls.value.role}
				visibility={controls.value.visibility}
				size={controls.value.size}
				content="A generated answer"
				onCopy={({ content }) => {
					lastAction = `Copied ${content.length} characters`;
				}}
				onEdit={() => {
					lastAction = 'Edit requested';
				}}
				onRetry={() => {
					lastAction = 'Retry requested';
				}}
			/>
			<div class="text-neutral/70 text-sm">{lastAction}</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Actions prop"
			description="The actions snippet receives copied state, capability flags, context, and awaitable copy, edit, and retry methods."
			class="!min-h-[220px]"
			code={`{#snippet actions({ copied, copy, size })}
  <Button type="button" {size} onclick={() => void copy()}>
    {copied ? 'Copied' : 'Copy answer'}
  </Button>
{/snippet}

<AIMessageActions content="Answer" {actions} />`}
		>
			<AIMessageActions content="Answer" actions={customActions} />
		</ComponentCard>

		<ComponentCard
			title="Child slot"
			description="The Svelai children slot remains an equivalent composition surface."
			class="!min-h-[220px]"
			code={`<AIMessageActions role="assistant" content="Answer" onRetry={regenerate}>
  {#snippet children({ canRetry, retry })}
    <Button type="button" disabled={!canRetry} onclick={() => void retry()}>
      Regenerate
    </Button>
  {/snippet}
</AIMessageActions>`}
		>
			<AIMessageActions role="assistant" content="Answer" onRetry={() => undefined}>
				{#snippet children({ canRetry, retry })}
					<Button
						type="button"
						variant="ghost"
						size="small"
						disabled={!canRetry}
						onclick={() => void retry()}>Regenerate</Button
					>
				{/snippet}
			</AIMessageActions>
		</ComponentCard>

		<ComponentCard
			title="Conversation fallback"
			description="Without a direct retry callback, the action targets its message through the nearest AIConversation. Pass conversation={null} to suppress that lookup."
			class="!min-h-[240px]"
			code={`<AIConversation
  messages={[message]}
  onRetry={({ message }) => regenerate(message)}
>
  <AIMessageActions
    {message}
    messageIndex={0}
    visibility="always"
  />
</AIConversation>`}
		>
			<div class="grid justify-items-center gap-3">
				<AIConversation
					messages={[providerMessage]}
					onRetry={({ message }) => {
						providerAction = `Retry requested for ${message?.id ?? 'unknown'}`;
					}}
				>
					<AIMessageActions message={providerMessage} messageIndex={0} visibility="always" />
				</AIConversation>
				<div class="text-neutral/70 text-sm">{providerAction}</div>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
