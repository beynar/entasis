<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Accordion from '../Accordion/Accordion.svelte';
	import type { AIToolCall, AIToolLabels, AIToolProps, AIToolStatus } from './aiTool.props.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import { createAIToolAccordionTheme } from './aiToolPrimitiveThemes.js';
	import {
		getAIToolCallValue,
		getAIToolGroupSummary,
		getAIToolGroupValue,
		getAIToolStatusLabel,
		getAIToolStatusTone,
		resolveAIToolGroupStatus,
		resolveAIToolStatus
	} from './toolRendering.js';
	import AIToolCallList from './AIToolCallList.svelte';
	import AIToolStatusMark from './AIToolStatusMark.svelte';
	import { createAIToolClock } from './aiToolClock.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type ToolGroupAccordionItem = { id: string; tools: readonly AIToolCall[] };

	let {
		ref = $bindable(null),
		size = 'normal',
		tool,
		tools = [],
		defaultValue = [],
		value = $bindable(),
		onValueChange,
		multiple = true,
		variant = 'ghost',
		toggleIcon = 'none',
		maxDepth = 8,
		maxEntries = 80,
		valueView = 'json',
		maxLines = 12,
		labels,
		formatStatus: formatStatusProp,
		icon,
		title,
		status,
		content,
		input,
		output,
		error,
		class: className,
		theme,
		...rootAttributes
	}: AIToolProps = $props();
	const t = $derived(useI18n());
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	let nestedValue = $state<string[]>([]);
	const resolvedTools = $derived(tools.length > 0 ? [...tools] : tool ? [tool] : []);
	const singleTool = $derived(resolvedTools.length === 1 ? resolvedTools[0] : undefined);
	const groupItems = $derived<ToolGroupAccordionItem[]>(
		resolvedTools.length > 1
			? [{ id: getAIToolGroupValue(resolvedTools), tools: resolvedTools }]
			: []
	);
	const resolvedLabels = $derived<AIToolLabels>({
		fallbackTitle: labels?.fallbackTitle ?? t.aiToolCall,
		group:
			labels?.group ??
			((_count, groupTools) =>
				getAIToolGroupSummary(groupTools, labels?.fallbackTitle ?? t.aiToolCall, t)),
		input: labels?.input ?? t.aiToolInput,
		output: labels?.output ?? t.aiToolOutput,
		error: labels?.error ?? t.aiToolError,
		empty: labels?.empty ?? t.aiToolEmpty,
		showAll: labels?.showAll ?? t.aiToolShowAll,
		showLess: labels?.showLess ?? t.aiToolShowLess
	});
	const formatStatus = $derived(
		formatStatusProp ?? ((value: AIToolStatus) => getAIToolStatusLabel(value, t))
	);
	const resolvedStatus = $derived(
		singleTool ? resolveAIToolStatus(singleTool) : resolveAIToolGroupStatus(resolvedTools)
	);
	const resolvedTone = $derived(getAIToolStatusTone(resolvedStatus));
	const classes = $derived(useAIToolTheme(theme));
	// One clock for every call, above the single/group switch: a lone call that becomes a group
	// (or a collapsed group whose rows are not mounted) keeps its observed run bounds.
	const clock = createAIToolClock(() =>
		resolvedTools.map((call, index) => ({
			key: getAIToolCallValue(call, index),
			tool: call,
			status: resolveAIToolStatus(call)
		}))
	);
	const groupAccordionTheme = $derived(
		createAIToolAccordionTheme(classes, {
			scope: 'group',
			variant,
			tone: resolvedTone,
			toggleIcon
		})
	);
</script>

{#snippet groupTitle(payload: { item: ToolGroupAccordionItem })}
	{@const currentStatus = resolveAIToolGroupStatus(payload.item.tools)}
	{@const tone = getAIToolStatusTone(currentStatus)}
	{@const statusLabel = formatStatus(currentStatus)}
	<div data-slot="ai-tool-group-trigger-content" data-tone={tone} class={classes.title()}>
		<AIToolStatusMark
			status={currentStatus}
			label={statusLabel}
			slot="ai-tool-group-icon"
			{theme}
		/>
		<span data-slot="ai-tool-group-title" class={classes.name()}>
			{resolvedLabels.group(payload.item.tools.length, payload.item.tools)}
		</span>
		{#if tone !== 'success'}
			<span data-slot="ai-tool-group-meta" class={classes.meta()}>
				<span data-slot="ai-tool-group-status" class={classes.statusWord({ tone })}>
					{statusLabel}
				</span>
			</span>
		{/if}
	</div>
{/snippet}

{#snippet groupContent(payload: { item: ToolGroupAccordionItem })}
	<div data-slot="ai-tool-group-panel-content" class={classes.groupContent({ variant })}>
		<AIToolCallList
			tools={payload.item.tools}
			bind:value={nestedValue}
			{multiple}
			{variant}
			{toggleIcon}
			labels={resolvedLabels}
			{clock}
			{formatStatus}
			{icon}
			{title}
			{status}
			{content}
			{input}
			{output}
			{error}
			{maxDepth}
			{maxEntries}
			{valueView}
			{maxLines}
			{theme}
		/>
	</div>
{/snippet}

{#if singleTool}
	<div
		{...rootAttributes}
		bind:this={ref}
		data-slot="ai-tool"
		data-variant={variant}
		data-size={size}
		data-status={resolvedStatus}
		class={classes.root({ scope: 'single', variant, tone: resolvedTone, className })}
	>
		<AIToolCallList
			tools={[singleTool]}
			bind:value={valueState.value}
			{onValueChange}
			{multiple}
			scope="single"
			{variant}
			{toggleIcon}
			labels={resolvedLabels}
			{clock}
			{formatStatus}
			{icon}
			{title}
			{status}
			{content}
			{input}
			{output}
			{error}
			{maxDepth}
			{maxEntries}
			{valueView}
			{maxLines}
			{theme}
		/>
	</div>
{:else if groupItems.length > 0}
	<div
		{...rootAttributes}
		bind:this={ref}
		data-slot="ai-tool"
		data-variant={variant}
		data-size={size}
		data-status={resolvedStatus}
		class={classes.root({ scope: 'group', variant, tone: resolvedTone, className })}
	>
		<Accordion
			{size}
			items={groupItems}
			bind:value={valueState.value}
			{onValueChange}
			oneAtATime={!multiple}
			title={groupTitle}
			content={groupContent}
			icon={toggleIcon}
			variant="classic"
			density="compact"
			theme={groupAccordionTheme}
		/>
	</div>
{/if}
