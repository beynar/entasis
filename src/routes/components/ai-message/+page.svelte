<script lang="ts">
	import AIConversation from '$lib/components/AIConversation/AIConversation.svelte';
	import AIMessage from '$lib/components/AIMessage/AIMessage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const tokenContent =
		'Review <File id="brief" label="launch-brief.md" path="docs/launch-brief.md" /> with <Skill id="review" label="Review" />, run <Command id="summarize" label="/summarize" />, cite <Reference id="release" label="Release plan" />, and notify <Mention id="platform" label="Platform team" />.';
	const retryMessage = {
		id: 'answer',
		role: 'assistant' as const,
		content: 'Retry uses the scoped provider.'
	};
	const controls = createComponentControls([
		{
			name: 'role',
			type: 'segmented',
			label: 'Role',
			value: 'assistant',
			options: ['assistant', 'user', 'system', 'tool']
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'bubble',
			options: ['bubble', 'minimal']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'actions',
			type: 'segmented',
			label: 'Actions',
			value: 'always',
			options: ['hover', 'always', 'none']
		}
	]);
</script>

<DocPage
	title="AI Message"
	subtitle="Role-aware transcript content with Markdown streaming, files, inline AI tokens, and reusable actions."
	component="AIMessage"
	features={[
		'Assistant, user, system, and tool layouts',
		'Bubble and minimal presentation variants',
		'Small, normal, and large content scales',
		'Markdown or plain text content',
		'File attachment rows with scroll fade',
		'File, reference, skill, command, and mention tokens',
		'Hover, always, or hidden actions',
		'Conversation-aware retry behavior'
	]}
>
	<ComponentCard
		{controls}
		description="Inline AI tokens use Streamdown's extension API while the message boundary disables raw HTML, permits HTTPS images, and limits links to HTTPS, email, and telephone URLs."
		class="!min-h-[320px] p-4"
		code={`<script lang="ts">
  import { AIMessage } from 'svelai/ai-message';
${'</' + 'script>'}

<AIMessage
  from="assistant"
  content={content}
  variant="minimal"
  size="normal"
  actionsVisibility="always"
/>`}
	>
		<AIMessage
			from={controls.value.role}
			content={controls.value.role === 'user' ? 'Use the attached launch brief.' : tokenContent}
			files={[{ name: 'launch-brief.md', size: 18_420, type: 'text/markdown' }]}
			variant={controls.value.variant}
			size={controls.value.size}
			actionsVisibility={controls.value.actions}
			class="w-full max-w-3xl"
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Conversation retry"
			description="Inside AIConversation, the default retry action targets the rendered message unless a direct callback overrides it."
			class="!min-h-[240px] p-4"
			code={`<AIConversation onRetry={({ message }) => regenerate(message)}>
  <AIMessage {message} messageIndex={0} retryable />
</AIConversation>`}
		>
			<AIConversation messages={[retryMessage]} onRetry={() => undefined}>
				<AIMessage message={retryMessage} messageIndex={0} actionsVisibility="always" />
			</AIConversation>
		</ComponentCard>

		<ComponentCard
			title="Body composition"
			description="The children slot receives the resolved message payload while AIMessage retains role layout, files, native attributes, and actions."
			class="!min-h-[240px] p-4"
			code={`<AIMessage message={message} size="large" variant="minimal">
  {#snippet children({ role, content, size, variant })}
	<strong>{role}</strong> · {size} · {variant}: {content}
  {/snippet}
</AIMessage>`}
		>
			<AIMessage
				message={{ id: 'custom', role: 'assistant', content: 'Rendered through the payload.' }}
				size="large"
				variant="minimal"
				actionsVisibility="always"
			>
				{#snippet children({ role: messageRole, content, size, variant })}
					<div class="grid gap-1">
						<span class="text-neutral/65 text-xs font-semibold uppercase"
							>{messageRole} · {size} · {variant}</span
						>
						<span>{content}</span>
					</div>
				{/snippet}
			</AIMessage>
		</ComponentCard>
	{/snippet}
</DocPage>
