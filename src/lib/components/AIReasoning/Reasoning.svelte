<script lang="ts">
	import Collapsible from '../Collapsible/Collapsible.svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { brainIcon } from '../Icons/brain.js';
	import Markdown from '../Markdown/Markdown.svelte';
	import Slot from '../Slot/Slot.svelte';
	import SpinnerText from '../SpinnerText/SpinnerText.svelte';
	import { untrack } from 'svelte';
	import type { CollapsibleThemeProps } from '../Collapsible/collapsible.theme.js';
	import type { AIReasoningLabels, AIReasoningState, ReasoningProps } from './aiReasoning.props.js';
	import { useAIReasoningTheme } from './aiReasoning.theme.js';

	const AUTO_CLOSE_DELAY = 1000;
	const MS_IN_S = 1000;
	const MESSAGE_INTERVAL = 2000;

	let {
		ref = $bindable(),
		content,
		isStreaming = false,
		defaultOpen,
		open = $bindable(),
		onOpenChange,
		duration: durationProp,
		autoCloseDelay = AUTO_CLOSE_DELAY,
		thinkingMessages,
		labels,
		trigger: triggerSlot,
		children: childrenSlot,
		markdown,
		class: className,
		theme,
		...attachments
	}: ReasoningProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen ?? isStreaming
	);
	const autoOpen = untrack(() => defaultOpen !== false);
	let computedDuration = $state<number | undefined>(undefined);
	let messageIndex = $state(0);
	const duration = $derived(durationProp ?? computedDuration);
	const resolvedLabels = $derived<AIReasoningLabels>({
		thinking: labels?.thinking ?? 'Thinking…',
		thoughtForFewSeconds: labels?.thoughtForFewSeconds ?? 'Thought for a few seconds',
		duration:
			labels?.duration ?? ((seconds) => `Thought for ${seconds} second${seconds === 1 ? '' : 's'}`)
	});
	const thinkingMessage = $derived(
		thinkingMessages?.length
			? (thinkingMessages[messageIndex % thinkingMessages.length] ?? resolvedLabels.thinking)
			: resolvedLabels.thinking
	);
	const displayedThinkingMessages = $derived([thinkingMessage]);
	const reasoningState = $derived<AIReasoningState>({
		open: openState.value,
		isStreaming,
		duration,
		message: thinkingMessage,
		labels: resolvedLabels
	});
	const classes = $derived(useAIReasoningTheme(theme));
	const collapsibleTheme = $derived<CollapsibleThemeProps>({
		trigger: { base: classes.trigger() },
		content: { base: classes.content() }
	});
	const rootAttributes = $derived({
		...attachments,
		'data-slot': 'ai-reasoning',
		'data-streaming': isStreaming || undefined
	});

	let hasAutoClosed = false;
	let didAutoOpen = false;
	let startedAt: number | null = null;

	function setOpen(nextOpen: boolean) {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}

	$effect(() => {
		if (!isStreaming) return;
		messageIndex = 0;
		const messages = thinkingMessages;
		if (!messages || messages.length <= 1) return;
		const interval = setInterval(() => {
			messageIndex = (messageIndex + 1) % messages.length;
		}, MESSAGE_INTERVAL);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (isStreaming) {
			if (startedAt === null) {
				startedAt = Date.now();
				hasAutoClosed = false;
			}
			if (!didAutoOpen && autoOpen) {
				setOpen(true);
				didAutoOpen = true;
			}
		} else if (startedAt !== null) {
			computedDuration = Math.ceil((Date.now() - startedAt) / MS_IN_S);
			startedAt = null;
			didAutoOpen = false;
		}
	});

	$effect(() => {
		if (computedDuration === undefined || isStreaming || !openState.value || hasAutoClosed) return;
		const closeTimer = setTimeout(
			() => {
				setOpen(false);
				hasAutoClosed = true;
			},
			Math.max(0, autoCloseDelay)
		);
		return () => clearTimeout(closeTimer);
	});
</script>

{#snippet defaultTrigger()}
	{@render brainIcon({ size: 16, class: classes.icon() })}
	{#if isStreaming || duration === 0}
		<SpinnerText
			texts={displayedThinkingMessages}
			shimmer
			showSpinner={false}
			size="small"
			class={classes.status()}
		/>
	{:else if duration === undefined}
		<span class={classes.duration()}>{resolvedLabels.thoughtForFewSeconds}</span>
	{:else}
		<span class={classes.duration()}>{resolvedLabels.duration(duration)}</span>
	{/if}
{/snippet}

<Collapsible
	bind:ref
	bind:open={openState.value}
	{onOpenChange}
	icon={triggerSlot === undefined ? undefined : false}
	class={classes.root({ className })}
	theme={collapsibleTheme}
	{...rootAttributes}
>
	{#snippet trigger()}
		<Slot render={triggerSlot ?? defaultTrigger} payload={reasoningState} />
	{/snippet}
	{#if content != null}
		<Markdown {content} size="small" {...markdown} renderHtml={false} />
	{:else if childrenSlot}
		<Slot render={childrenSlot} payload={reasoningState} />
	{/if}
</Collapsible>
