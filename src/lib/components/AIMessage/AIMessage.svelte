<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import type { StreamdownProps } from 'svelte-streamdown';
	import Markdown from '../Markdown/Markdown.svelte';
	import type { MarkdownSize } from '../Markdown/markdown.props.js';
	import Slot from '../Slot/Slot.svelte';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import AIMessageActions from '../AIMessageActions/AIMessageActions.svelte';
	import type { AIThreadItem, AIThreadRole } from '../AIThread/aiThread.props.js';
	import type { AIMessageProps, AIMessageRenderPayload, AIMessageSize } from './aiMessage.props.js';
	import { useAIMessageTheme } from './aiMessage.theme.js';
	import AIMessageFiles from './AIMessageFiles.svelte';
	import AIMessageMdxToken from './AIMessageMdxToken.svelte';
	import {
		aiMessageInlineMdxExtension,
		protectAIMessageInlineMdxBlocks
	} from './aiMessageInlineMdx.js';

	let {
		ref = $bindable(),
		message,
		messageIndex,
		index,
		from,
		name,
		content,
		files,
		size = 'normal',
		variant = 'minimal',
		color,
		streaming = false,
		markdown = true,
		streamdown,
		markdownProps,
		conversation,
		actions,
		actionsVisibility,
		actionVisibility,
		copyable,
		editable,
		retryable,
		copyAction = true,
		editAction,
		retryAction,
		children,
		onCopy,
		onEdit,
		onRetry,
		class: className,
		theme,
		...attachments
	}: AIMessageProps<TMessage> = $props();
	const resolvedIndex = $derived(messageIndex ?? index);
	const resolvedRole = $derived<AIThreadRole>(from ?? message?.role ?? 'assistant');
	const resolvedName = $derived(name ?? message?.name);
	const resolvedContent = $derived(content ?? message?.content ?? '');
	const resolvedFiles = $derived(files ?? message?.files ?? []);
	const resolvedMarkdownProps = $derived(streamdown ?? markdownProps);
	const allowedLinkPrefixes = $derived(
		resolvedMarkdownProps?.allowedLinkPrefixes ?? ['https://', 'mailto:', 'tel:']
	);
	const allowedImagePrefixes = $derived(
		resolvedMarkdownProps?.allowedImagePrefixes ?? ['https://']
	);
	const resolvedActionVisibility = $derived(actionsVisibility ?? actionVisibility ?? 'always');
	const resolvedColor = $derived(useDefaultColor(color));
	const resolvedCopyable = $derived(copyable ?? copyAction);
	const resolvedEditable = $derived(editable ?? editAction ?? resolvedRole === 'user');
	const resolvedRetryable = $derived(retryable ?? retryAction ?? resolvedRole === 'assistant');
	const payload = $derived<AIMessageRenderPayload<TMessage>>({
		message,
		index: resolvedIndex,
		messageIndex: resolvedIndex,
		role: resolvedRole,
		content: resolvedContent,
		size,
		variant
	});
	const classes = $derived(useAIMessageTheme(theme));
	const inlineComponents = {
		File: AIMessageMdxToken,
		Reference: AIMessageMdxToken,
		Mention: AIMessageMdxToken,
		Skill: AIMessageMdxToken,
		Command: AIMessageMdxToken
	} satisfies NonNullable<StreamdownProps['mdxComponents']>;
	const mdxComponents = $derived({ ...inlineComponents, ...resolvedMarkdownProps?.mdxComponents });
	const extensions = $derived([
		aiMessageInlineMdxExtension,
		...(resolvedMarkdownProps?.extensions ?? [])
	]);
	const markdownContent = $derived(protectAIMessageInlineMdxBlocks(resolvedContent));
	const markdownSize = $derived(resolveMarkdownSize(size));
	const roleLayout = $derived(resolveRoleLayout(resolvedRole));
	const fileAlignment = $derived(resolveFileAlignment(roleLayout));
	// A message that only carries files (an upload with no prompt) shows no empty bubble.
	const showBubble = $derived(
		children !== undefined || streaming || resolvedContent !== '' || resolvedFiles.length === 0
	);

	function resolveRoleLayout(value: AIThreadRole): 'user' | 'assistant' | 'system' | 'tool' {
		if (value === 'user') return 'user';
		if (value === 'system') return 'system';
		if (value === 'tool') return 'tool';
		return 'assistant';
	}

	function resolveFileAlignment(
		value: 'user' | 'assistant' | 'system' | 'tool'
	): 'start' | 'center' | 'end' {
		if (value === 'user') return 'end';
		if (value === 'system') return 'center';
		return 'start';
	}

	// The Markdown scale supplies block spacing and code size; AIMessage's own `markdown` theme part
	// sets the prose type size and the heading steps on top of it.
	function resolveMarkdownSize(value: AIMessageSize): MarkdownSize {
		return value;
	}
</script>

<article
	bind:this={ref}
	data-slot="ai-message"
	data-from={resolvedRole}
	data-role={resolvedRole}
	data-size={size}
	data-variant={variant}
	data-color={resolvedColor}
	data-streaming={streaming ? 'true' : undefined}
	data-actions-visibility={resolvedActionVisibility}
	class={classes.root({
		role: roleLayout,
		size,
		className
	})}
	{...attachments}
>
	<div data-slot="ai-message-body" class={classes.body({ role: roleLayout, size, variant })}>
		{#if resolvedName}<div data-slot="ai-message-name" class={classes.header({ size })}>
				{resolvedName}
			</div>{/if}
		<AIMessageFiles files={resolvedFiles} align={fileAlignment} {size} class={classes.files()} />
		{#if showBubble}
			<div
				data-slot="ai-message-content"
				class={classes.bubble({ role: roleLayout, size, variant, color: resolvedColor })}
			>
				{#if children !== undefined}<Slot render={children} {payload} />{:else if markdown}<Markdown
						content={markdownContent}
						{...resolvedMarkdownProps}
						size={markdownSize}
						class={classes.markdown({ size, className: resolvedMarkdownProps?.class })}
						{allowedLinkPrefixes}
						{allowedImagePrefixes}
						renderHtml={false}
						{extensions}
						{mdxComponents}
					/>{:else}<span class="whitespace-pre-wrap">{resolvedContent}</span>{/if}
				{#if streaming}<span data-slot="ai-message-caret" aria-hidden="true" class={classes.caret()}
					></span>{/if}
			</div>
		{/if}
		<AIMessageActions
			{message}
			messageIndex={resolvedIndex}
			role={resolvedRole}
			content={resolvedContent}
			{size}
			{conversation}
			{actions}
			visibility={resolvedActionVisibility}
			copyable={resolvedCopyable}
			editable={resolvedEditable}
			retryable={resolvedRetryable}
			{onCopy}
			{onEdit}
			{onRetry}
			class={classes.actions({ visibility: resolvedActionVisibility })}
		/>
	</div>
</article>
