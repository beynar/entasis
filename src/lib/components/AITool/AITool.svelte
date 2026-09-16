<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Accordion from '../Accordion/Accordion.svelte';
	import Spinner from '../Spinner/Spinner.svelte';
	import type { AIToolCall, AIToolLabels, AIToolProps } from './aiTool.props.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import { createAIToolAccordionTheme } from './aiToolPrimitiveThemes.js';
	import {
		formatAIToolStatus,
		getAIToolGroupValue,
		getAIToolStatusTone,
		isActiveAIToolStatus,
		resolveAIToolGroupStatus,
		resolveAIToolStatus
	} from './toolRendering.js';
	import AIToolCallList from './AIToolCallList.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type ToolGroupAccordionItem = { id: string; tools: readonly AIToolCall[] };

	let {
		ref = $bindable(null),
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
		labels,
		formatStatus = formatAIToolStatus,
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
		group: labels?.group ?? t.aiToolCalls,
		input: labels?.input ?? t.aiToolInput,
		output: labels?.output ?? t.aiToolOutput,
		error: labels?.error ?? t.aiToolError,
		empty: labels?.empty ?? t.aiToolEmpty
	});
	const resolvedStatus = $derived(
		singleTool ? resolveAIToolStatus(singleTool) : resolveAIToolGroupStatus(resolvedTools)
	);
	const resolvedTone = $derived(getAIToolStatusTone(resolvedStatus));
	const classes = $derived(useAIToolTheme(theme));
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
	<div data-slot="ai-tool-group-trigger-content" class={classes.title()}>
		<span
			data-slot="ai-tool-group-icon"
			role="img"
			aria-label={formatStatus(currentStatus)}
			class={classes.groupIcon({ tone: getAIToolStatusTone(currentStatus) })}
		>
			{#if isActiveAIToolStatus(currentStatus)}
				<Spinner size="small" decorative class="motion-reduce:[&_*]:animate-none" />
			{:else}
				<span class={classes.indicatorDot()}></span>
			{/if}
		</span>
		<span data-slot="ai-tool-group-title" class={classes.name()}>
			{resolvedLabels.group(payload.item.tools.length)}
		</span>
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
		data-status={resolvedStatus}
		class={classes.root({ scope: 'single', variant, tone: resolvedTone, className })}
	>
		<AIToolCallList
			tools={[singleTool]}
			bind:value={valueState.value}
			{onValueChange}
			{multiple}
			scope="single"
			{toggleIcon}
			labels={resolvedLabels}
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
			{theme}
		/>
	</div>
{:else if groupItems.length > 0}
	<div
		{...rootAttributes}
		bind:this={ref}
		data-slot="ai-tool"
		data-variant={variant}
		data-status={resolvedStatus}
		class={classes.root({ scope: 'group', variant, tone: resolvedTone, className })}
	>
		<Accordion
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
