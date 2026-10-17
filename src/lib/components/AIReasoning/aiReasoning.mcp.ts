export const aiReasoningDescription = `
# AIReasoning

AIReasoning renders an AI reasoning trace in the Entasis Collapsible primitive. It opens when a stream starts, measures elapsed time in seconds, and closes shortly after the first streamed completion.

## Import

\`\`\`svelte
<script lang="ts">
	import { AIReasoning } from 'entasis/ai-reasoning';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<AIReasoning
	content={reasoningText}
	{streaming}
	thinkingMessages={['Planning', 'Checking constraints', 'Preparing response']}
/>
\`\`\`

The default trigger is a compact, muted text-sm row about 28px tall with no filled background. It displays a brain icon and a shimmering label while streaming, followed by a live elapsed time once a second has passed ("Thinking… · 6s"). A supplied \`thinkingMessages\` list replaces the resolved \`labels.thinking\` value and advances every two seconds when it contains more than one message. Every message sits in the same grid cell, so the trigger keeps the widest message's width (the caret never shifts) and only the current message is visible and part of the button's accessible name; the elapsed time is hidden from assistive technology and reserves the width of its unit's widest reading (59s, then 59m 59s), so the caret holds still as the count gains a digit and steps only when the unit changes. The compact \`labels\` object also overrides the unknown-duration sentence and completed-duration formatter.

Completed durations read "Thought for less than a second" for \`0\`, "Thought for 6 seconds" under a minute, and "Thought for 1m 12s" from a minute on.

While streaming, the body is a bounded window (\`max-h-40\`) that follows the newest lines; once earlier lines leave the window its top edge fades. The full body returns when streaming ends. The body renders Markdown at \`size="normal"\` (text-sm) in a muted colour that Markdown paragraphs and lists inherit, so reasoning reads quieter than the answer. The root has no outer margin: the surrounding thread or message owns the spacing.

## Streaming lifecycle

- \`open\` starts from \`defaultOpen ?? streaming\`.
- At the start of a streaming session, the component auto-opens once unless \`defaultOpen={false}\`.
- Closing the panel manually during that stream keeps it closed; streaming does not force it open again.
- When streaming ends, the measured duration is rounded to whole seconds (under half a second becomes \`0\`).
- After the first observed stream completes, an open panel closes after \`1000\` ms by default. A trace that never streamed is not auto-closed.
- An explicit \`duration\` is expressed in seconds and takes precedence over the measured duration.

Use \`defaultOpen={false}\` to opt out of streaming auto-open without disabling manual toggling:

\`\`\`svelte
<AIReasoning content={reasoningText} streaming defaultOpen={false} />
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

<AIReasoning
	content={reasoningText}
	duration={8}
	bind:open
	onOpenChange={handleOpenChange}
/>
<p>Last user-selected state: {lastUserState ? 'open' : 'closed'}</p>
\`\`\`

## Custom trigger and body

A custom \`trigger\` replaces the complete default row, including its default label and caret. The Collapsible button remains the interactive and accessible owner. The trigger payload is \`{ open, streaming, duration, elapsed, message, labels }\`, where \`message\` is the currently displayed thinking label and \`elapsed\` the whole seconds of the current stream.

\`\`\`svelte
<AIReasoning streaming thinkingMessages={['Planning', 'Checking']}>
	{#snippet trigger({ open, streaming, duration, message })}
		<span class="flex w-full items-center justify-between">
			{#if streaming}
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
</AIReasoning>
\`\`\`

\`content\` is optional. When it is non-null, it is rendered as Markdown and takes precedence over \`children\`:

\`\`\`svelte
<AIReasoning content="**This Markdown is rendered.**" defaultOpen>
	<p>This custom body is ignored because content was supplied.</p>
</AIReasoning>
\`\`\`

## Markdown safety

Pass Markdown options through \`markdown\`. AIReasoning owns \`content\` and always forces \`renderHtml={false}\`, even if renderer options are spread into Markdown.

\`\`\`svelte
<AIReasoning content={reasoningText} markdown={markdownOptions} />
\`\`\`

## Theme slots

The AIReasoning \`trigger\` and \`content\` theme slots are composed into the actual Collapsible trigger button and content panel. \`root\` styles the Collapsible root; \`icon\`, \`status\` (the stacked label cell), \`message\` (each cycled label, \`current\` variant), \`elapsed\` (with \`elapsedReserve\`, its invisible widest reading), and \`duration\` style the default trigger regions; \`stream\` and \`streamBody\` style the streaming window.

\`\`\`svelte
<AIReasoning
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
- \`streaming?: boolean\`: Drives status labels, the live elapsed time, the following window, auto-open, duration measurement, and completion close.
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
