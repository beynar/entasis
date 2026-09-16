<script lang="ts">
	import HoverCard from '../HoverCard/HoverCard.svelte';
	import ProgressCircle from '../ProgressCircle/ProgressCircle.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import type {
		AIContextLabels,
		AIContextProps,
		AIContextState,
		AIContextUsage
	} from './aiContext.props.js';
	import { useAIContextTheme } from './aiContext.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		maxTokens = 128000,
		usedTokens,
		usage,
		compact = false,
		warningAt = 70,
		dangerAt = 90,
		formatTokens = formatTokenCount,
		labels,
		dir = 'ltr',
		children,
		content,
		class: className,
		theme,
		...attachments
	}: AIContextProps = $props();

	const conversation = getAIConversation();
	const t = $derived(useI18n());
	const resolvedUsage = $derived(
		usage === undefined ? conversation?.contextUsage : (usage ?? undefined)
	);
	const resolvedMaxTokens = $derived(Math.max(0, maxTokens));
	const resolvedUsedTokens = $derived(Math.max(0, usedTokens ?? usageTotal(resolvedUsage)));
	const percent = $derived(
		resolvedMaxTokens === 0 ? 0 : (resolvedUsedTokens / resolvedMaxTokens) * 100
	);
	const clampedPercent = $derived(Math.max(0, Math.min(100, percent)));
	const remainingTokens = $derived(Math.max(0, resolvedMaxTokens - resolvedUsedTokens));
	const tone = $derived<AIContextState['tone']>(resolveTone(percent));
	const resolvedLabels = $derived<AIContextLabels>({
		title: labels?.title ?? t.aiContextTitle,
		remaining: labels?.remaining ?? t.aiContextRemaining,
		input: labels?.input ?? t.aiContextInput,
		output: labels?.output ?? t.aiContextOutput,
		reasoning: labels?.reasoning ?? t.aiContextReasoning,
		cachedInput: labels?.cachedInput ?? t.aiContextCachedInput,
		used: labels?.used ?? t.aiContextUsed,
		maximum: labels?.maximum ?? t.maximumLabel,
		label: labels?.label ?? t.aiContextUsage
	});
	const state = $derived<AIContextState>({
		maxTokens: resolvedMaxTokens,
		usedTokens: resolvedUsedTokens,
		remainingTokens,
		percent,
		tone,
		formattedUsed: formatTokens(resolvedUsedTokens),
		formattedMax: formatTokens(resolvedMaxTokens),
		formattedRemaining: formatTokens(remainingTokens),
		labels: resolvedLabels
	});
	const rows = $derived(
		[
			{
				id: 'input',
				label: resolvedLabels.input,
				value: Math.max(0, resolvedUsage?.inputTokens ?? 0)
			},
			{
				id: 'output',
				label: resolvedLabels.output,
				value: Math.max(0, resolvedUsage?.outputTokens ?? 0)
			},
			{
				id: 'reasoning',
				label: resolvedLabels.reasoning,
				value: Math.max(0, resolvedUsage?.reasoningTokens ?? 0)
			},
			{
				id: 'cached-input',
				label: resolvedLabels.cachedInput,
				value: Math.max(0, resolvedUsage?.cachedInputTokens ?? 0)
			}
		].filter((row) => row.value > 0)
	);
	const classes = $derived(useAIContextTheme(theme));

	function usageTotal(currentUsage: AIContextUsage | undefined): number {
		if (!currentUsage) return 0;
		if (currentUsage.totalTokens !== undefined) return Math.max(0, currentUsage.totalTokens);
		return (
			Math.max(0, currentUsage.inputTokens ?? 0) +
			Math.max(0, currentUsage.outputTokens ?? 0) +
			Math.max(0, currentUsage.reasoningTokens ?? 0)
		);
	}

	function formatTokenCount(tokens: number): string {
		if (tokens >= 1_000_000)
			return `${(tokens / 1_000_000).toFixed(tokens >= 10_000_000 ? 0 : 1)}M`;
		if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(tokens >= 10_000 ? 0 : 1)}K`;
		return `${tokens}`;
	}

	function resolveTone(value: number): AIContextState['tone'] {
		if (value >= dangerAt) return 'danger';
		if (value >= warningAt) return 'warning';
		return 'default';
	}

	function progressColor(currentTone: AIContextState['tone']): 'danger' | 'warning' | 'primary' {
		if (currentTone === 'danger') return 'danger';
		if (currentTone === 'warning') return 'warning';
		return 'primary';
	}
</script>

{#snippet trigger()}
	{#if children}
		<Slot render={children} payload={state} />
	{:else}
		<button
			type="button"
			data-slot="ai-context-trigger"
			data-compact={compact || undefined}
			data-tone={tone}
			aria-label={resolvedLabels.label(
				state.formattedUsed,
				state.formattedMax,
				state.formattedRemaining
			)}
			class={classes.trigger({ compact, tone })}
		>
			<ProgressCircle
				value={clampedPercent}
				size="small"
				color={progressColor(tone)}
				decorative
				class={classes.progress()}
			/>
			{#if !compact}<span class={classes.triggerValue()}
					>{state.formattedUsed} / {state.formattedMax}</span
				>{/if}
		</button>
	{/if}
{/snippet}

{#snippet details()}
	<div data-slot="ai-context-details" data-tone={tone} {dir}>
		{#if content}
			<Slot render={content} payload={state} />
		{:else}
			<div data-slot="ai-context-content" class={classes.content()}>
				<div data-slot="ai-context-summary" class={classes.summary()}>
					<div>
						<div data-slot="ai-context-title" class={classes.title()}>{resolvedLabels.title}</div>
						<div data-slot="ai-context-remaining" class={classes.remaining()}>
							{resolvedLabels.remaining(state.formattedRemaining)}
						</div>
					</div>
					<div data-slot="ai-context-percent" class={classes.percent()}>
						{Math.round(state.percent)}%
					</div>
				</div>
				<div data-slot="ai-context-meter" class={classes.meter()}>
					<div
						data-slot="ai-context-bar"
						data-tone={tone}
						class={classes.bar({ tone })}
						style:width={`${clampedPercent}%`}
					></div>
				</div>
				<div data-slot="ai-context-rows" class={classes.rows()}>
					<div data-slot="ai-context-row" class={classes.row()}>
						<span class={classes.rowLabel()}>{resolvedLabels.used}</span><span
							class={classes.rowValue()}>{state.formattedUsed}</span
						>
					</div>
					<div data-slot="ai-context-row" class={classes.row()}>
						<span class={classes.rowLabel()}>{resolvedLabels.maximum}</span><span
							class={classes.rowValue()}>{state.formattedMax}</span
						>
					</div>
					{#each rows as row (row.id)}<div data-slot="ai-context-row" class={classes.row()}>
							<span class={classes.rowLabel()}>{row.label}</span><span class={classes.rowValue()}
								>{formatTokens(row.value)}</span
							>
						</div>{/each}
				</div>
			</div>
		{/if}
	</div>
{/snippet}

<div
	bind:this={ref}
	data-slot="ai-context"
	data-compact={compact || undefined}
	data-tone={tone}
	{dir}
	class={classes.root({ className })}
	{...attachments}
>
	<HoverCard
		{trigger}
		children={details}
		position="top-end"
		delay={120}
		closeDelay={120}
		class={classes.card()}
		popover={{ class: classes.popover() }}
		card={{ theme: { content: { base: classes.cardContent() } } }}
	/>
</div>
