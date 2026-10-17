<script lang="ts">
	import Collapsible from '../Collapsible/Collapsible.svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { brainIcon } from '../Icons/brain.js';
	import Markdown from '../Markdown/Markdown.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { formatAIElapsed } from '../AITool/toolRendering.js';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { CollapsibleThemeProps } from '../Collapsible/collapsible.theme.js';
	import type {
		AIReasoningLabels,
		AIReasoningState,
		AIReasoningProps
	} from './aiReasoning.props.js';
	import { useAIReasoningTheme } from './aiReasoning.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	const AUTO_CLOSE_DELAY = 1000;
	const MS_IN_S = 1000;
	const MESSAGE_INTERVAL = 2000;
	const ELAPSED_TICK = 1000;

	let {
		ref = $bindable(),
		size = 'normal',
		content,
		streaming = false,
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
	}: AIReasoningProps = $props();
	const t = $derived(useI18n());
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen ?? streaming
	);
	const autoOpen = untrack(() => defaultOpen !== false);
	let computedDuration = $state<number | undefined>(undefined);
	let messageIndex = $state(0);
	let streamStartedAt = $state<number | null>(null);
	let now = $state(0);
	let overflowing = $state(false);
	const duration = $derived(durationProp ?? computedDuration);
	const resolvedLabels = $derived<AIReasoningLabels>({
		thinking: labels?.thinking ?? t.aiReasoningThinking,
		thoughtForFewSeconds: labels?.thoughtForFewSeconds ?? t.aiReasoningFewSeconds,
		duration: labels?.duration ?? formatDuration
	});
	const messages = $derived(
		thinkingMessages?.length ? [...new Set(thinkingMessages)] : [resolvedLabels.thinking]
	);
	const thinkingMessage = $derived(
		messages[messageIndex % messages.length] ?? resolvedLabels.thinking
	);
	// Elapsed seconds while streaming, shown once the first second has passed.
	const elapsed = $derived(
		streaming && streamStartedAt !== null ? Math.max(0, now - streamStartedAt) : undefined
	);
	const reasoningState = $derived<AIReasoningState>({
		open: openState.value,
		streaming,
		duration,
		elapsed: elapsed === undefined ? undefined : Math.floor(elapsed / MS_IN_S),
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
		'data-streaming': streaming || undefined
	});

	let hasAutoClosed = false;
	let didAutoOpen = false;

	function formatDuration(seconds: number): string {
		if (seconds <= 0) return t.aiReasoningUnderSecond;
		if (seconds < 60) return t.aiReasoningDuration(seconds);
		return t.aiReasoningDurationLong(formatAIElapsed(seconds * MS_IN_S, t));
	}

	function setOpen(nextOpen: boolean) {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}

	$effect(() => {
		if (!streaming) return;
		messageIndex = 0;
		const count = messages.length;
		if (count <= 1) return;
		const interval = setInterval(() => {
			messageIndex = (messageIndex + 1) % count;
		}, MESSAGE_INTERVAL);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (streaming) {
			untrack(() => {
				if (streamStartedAt === null) {
					streamStartedAt = Date.now();
					now = streamStartedAt;
					hasAutoClosed = false;
				}
				if (!didAutoOpen && autoOpen) {
					setOpen(true);
					didAutoOpen = true;
				}
			});
		} else {
			untrack(() => {
				if (streamStartedAt === null) return;
				// Rounded, so a sub-half-second thought reads "less than a second" rather than 1.
				computedDuration = Math.round((Date.now() - streamStartedAt) / MS_IN_S);
				streamStartedAt = null;
				didAutoOpen = false;
			});
		}
	});

	/** The widest elapsed reading in the same unit as `milliseconds` (59s, 59m 59s, 99h 59m). */
	function widestElapsed(milliseconds: number): number {
		const seconds = Math.floor(milliseconds / MS_IN_S);
		if (seconds < 60) return 59 * MS_IN_S;
		if (seconds < 3600) return 3599 * MS_IN_S;
		const hourDigits = String(Math.floor(seconds / 3600)).length;
		return (Number('9'.repeat(hourDigits)) * 3600 + 59 * 60) * MS_IN_S;
	}

	// Live elapsed time: one tick per second, only while streaming.
	$effect(() => {
		if (!streaming) return;
		const timer = setInterval(() => {
			now = Date.now();
		}, ELAPSED_TICK);
		return () => clearInterval(timer);
	});

	$effect(() => {
		if (computedDuration === undefined || streaming || !openState.value || hasAutoClosed) return;
		const closeTimer = setTimeout(
			() => {
				setOpen(false);
				hasAutoClosed = true;
			},
			Math.max(0, autoCloseDelay)
		);
		return () => clearTimeout(closeTimer);
	});

	// While streaming, the body is a bounded window pinned to its latest lines; the top fades only
	// once earlier lines have actually scrolled out of it.
	const followLatest: Attachment<HTMLElement> = (node) => {
		const body = node.firstElementChild;
		if (!(body instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
		const measure = () => {
			overflowing = body.offsetHeight > node.clientHeight + 1;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		observer.observe(body);
		measure();
		return () => {
			observer.disconnect();
			overflowing = false;
		};
	};
</script>

{#snippet defaultTrigger()}
	{@render brainIcon({ size: 16, class: classes.icon(), 'aria-hidden': 'true' })}
	{#if streaming}
		<!-- Every label sits in one grid cell, so the trigger keeps the widest label's width and the
		     chevron never shifts while messages cycle. Only the current one is visible and named. -->
		<span data-slot="ai-reasoning-status" class={classes.status()}>
			{#each messages as message, index (message)}
				<span
					class={classes.message({ current: index === messageIndex % messages.length })}
					aria-hidden={index === messageIndex % messages.length ? undefined : 'true'}
				>
					{message}
				</span>
			{/each}
		</span>
		{#if elapsed !== undefined && elapsed >= MS_IN_S}
			<!-- The widest reading of the current unit shares the cell, so the chevron holds still as
			     the count gains a digit (9s → 10s) and only steps once per unit change. -->
			<span data-slot="ai-reasoning-elapsed" aria-hidden="true" class={classes.elapsed()}>
				<span class={classes.elapsedReserve()}>· {formatAIElapsed(widestElapsed(elapsed), t)}</span>
				<span>· {formatAIElapsed(elapsed, t)}</span>
			</span>
		{/if}
	{:else if duration === undefined}
		<span data-slot="ai-reasoning-duration" class={classes.duration()}>
			{resolvedLabels.thoughtForFewSeconds}
		</span>
	{:else}
		<span data-slot="ai-reasoning-duration" class={classes.duration()}>
			{resolvedLabels.duration(duration)}
		</span>
	{/if}
{/snippet}

{#snippet body()}
	{#if content != null}
		<Markdown
			{content}
			size={size === 'large' ? 'normal' : 'small'}
			{...markdown}
			renderHtml={false}
		/>
	{:else if childrenSlot}
		<Slot render={childrenSlot} payload={reasoningState} />
	{/if}
{/snippet}

<Collapsible
	bind:ref
	bind:open={openState.value}
	onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
	icon={triggerSlot === undefined ? undefined : 'none'}
	{size}
	class={classes.root({ className })}
	theme={collapsibleTheme}
	{...rootAttributes}
>
	{#snippet trigger()}
		<Slot render={triggerSlot ?? defaultTrigger} payload={reasoningState} />
	{/snippet}
	{#if streaming}
		<div
			data-slot="ai-reasoning-stream"
			data-overflowing={overflowing || undefined}
			class={classes.stream({ overflowing })}
			{@attach followLatest}
		>
			<div class={classes.streamBody()}>{@render body()}</div>
		</div>
	{:else}
		{@render body()}
	{/if}
</Collapsible>
