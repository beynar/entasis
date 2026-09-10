export const aiReasoningDescription = `
# Reasoning

AIReasoning renders an AI reasoning trace in the Svelai Collapsible primitive. It opens when a stream starts, measures elapsed time in seconds, and closes shortly after the first streamed completion.

## Import

\`\`\`svelte
<script lang="ts">
	import { Reasoning } from 'svelai/ai-reasoning';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<Reasoning
	content={reasoningText}
	{isStreaming}
	thinkingMessages={['Planning', 'Checking constraints', 'Preparing response']}
/>
\`\`\`

The default trigger displays a brain icon and a shimmer-only \`SpinnerText\` label while streaming. A supplied \`thinkingMessages\` list replaces the resolved \`labels.thinking\` value and advances every two seconds when it contains more than one message. The compact \`labels\` object also overrides the unknown-duration sentence and completed-duration formatter.

## Streaming lifecycle

- \`open\` starts from \`defaultOpen ?? isStreaming\`.
- At the start of a streaming session, the component auto-opens once unless \`defaultOpen={false}\`.
- Closing the panel manually during that stream keeps it closed; streaming does not force it open again.
- When streaming ends, the measured duration is rounded up to whole seconds.
- After the first observed stream completes, an open panel closes after \`1000\` ms by default. A trace that never streamed is not auto-closed.
- An explicit \`duration\` is expressed in seconds and takes precedence over the measured duration.

Use \`defaultOpen={false}\` to opt out of streaming auto-open without disabling manual toggling:

\`\`\`svelte
<Reasoning content={reasoningText} isStreaming defaultOpen={false} />
\`\`\`

## Controlled state

\`open\` is bindable. \`onOpenChange\` runs once for user toggles and automatic stream-driven open or close changes. Initialization and parent assignments do not invoke it.

\`\`\`svelte
<script lang="ts">
	let open = $state(true);
	let lastUserState = $state(open);

	function handleOpenChange(nextOpen: boolean) {
		lastUserState = nextOpen;
	}
</script>

<Reasoning
	content={reasoningText}
	duration={8}
	bind:open
	onOpenChange={handleOpenChange}
/>
<p>Last user-selected state: {lastUserState ? 'open' : 'closed'}</p>
\`\`\`

## Custom trigger and body

A custom \`trigger\` replaces the complete default row, including its default label and caret. The Collapsible button remains the interactive and accessible owner. The trigger payload is \`{ open, isStreaming, duration, message }\`, where \`message\` is the currently displayed thinking label.

\`\`\`svelte
<Reasoning isStreaming thinkingMessages={['Planning', 'Checking']}>
	{#snippet trigger({ open, isStreaming, duration, message })}
		<span class="flex w-full items-center justify-between">
			{#if isStreaming}
				<span>{message}</span>
			{:else if duration !== undefined}
				<span>Thought for {duration}s</span>
			{/if}
			<span>{open ? 'Hide' : 'Show'}</span>
		</span>
	{/snippet}

	{#snippet children({ message })}
		<p>Current step: {message}</p>
	{/snippet}
</Reasoning>
\`\`\`

\`content\` is optional. When it is non-null, it is rendered as Markdown and takes precedence over \`children\`:

\`\`\`svelte
<Reasoning content="**This Markdown is rendered.**" defaultOpen>
	<p>This custom body is ignored because content was supplied.</p>
</Reasoning>
\`\`\`

## Markdown safety

Pass Markdown options through \`markdown\`. AIReasoning owns \`content\` and always forces \`renderHtml={false}\`, even if renderer options are spread into Markdown.

\`\`\`svelte
<Reasoning content={reasoningText} markdown={markdownOptions} />
\`\`\`

## Theme slots

The AIReasoning \`trigger\` and \`content\` theme slots are composed into the actual Collapsible trigger button and content panel. \`root\` styles the Collapsible root; \`icon\`, \`status\`, and \`duration\` style the default trigger regions.

\`\`\`svelte
<Reasoning
	content={reasoningText}
	defaultOpen
	theme={{
		root: { base: 'w-full' },
		trigger: { base: 'rounded-md px-2' },
		content: { base: 'mt-3 pl-5' }
	}}
/>
\`\`\`

Global overrides use \`setAIReasoningTheme\` from the same package entry.

## Props

- \`content?: string\`: Markdown trace. Takes precedence over custom children.
- \`isStreaming?: boolean\`: Drives status labels, auto-open, duration measurement, and completion close.
- \`thinkingMessages?: readonly string[]\`: Optional labels cycled every two seconds while streaming; takes precedence over \`labels.thinking\`.
- \`labels?: Partial<AIReasoningLabels>\`: Default thinking text, unknown-duration text, and duration formatter.
- \`open?: boolean\`: Bindable open state.
- \`defaultOpen?: boolean\`: Initial state; false also opts out of streaming auto-open.
- \`onOpenChange?: (open: boolean) => void\`: Component-owned open-state callback.
- \`duration?: number\`: Controlled duration in seconds.
- \`autoCloseDelay?: number\`: First-completion close delay in milliseconds; defaults to 1000.
- \`trigger?: Slot<AIReasoningState>\`: Complete trigger replacement.
- \`children?: Slot<AIReasoningState>\`: Custom body used only when content is omitted.
- \`markdown?: Omit<MarkdownProps, 'content' | 'renderHtml'>\`: Markdown renderer options.
- \`class?: string\`: Class merged onto the Collapsible root.
- \`theme?: AIReasoningThemeProps\`: Root, trigger, and content theme overrides.
- Additional attachments and DOM attributes are forwarded to the Collapsible root.
`;
