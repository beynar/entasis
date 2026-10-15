<script lang="ts">
	import Accordion from '../Accordion/Accordion.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type {
		AIToolCall,
		AIToolLabels,
		AIToolRenderPayload,
		AIToolSnippet,
		AIToolStatus,
		AIToolToggleIcon,
		AIToolValueView,
		AIToolVariant
	} from './aiTool.props.js';
	import type { AIToolThemeProps } from './aiTool.theme.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import {
		createAIToolAccordionTheme,
		type AIToolAccordionScope
	} from './aiToolPrimitiveThemes.js';
	import { createAIToolClock } from './aiToolClock.svelte.js';
	import {
		formatAIElapsed,
		getAIToolCallValue,
		getAIToolErrorValue,
		getAIToolGroupValue,
		getAIToolOutputValue,
		getAIToolStatusTone,
		getAIToolSummary,
		getAIToolTitle,
		hasRenderableAIToolValue,
		resolveAIToolStatus
	} from './toolRendering.js';
	import AIToolStatusMark from './AIToolStatusMark.svelte';
	import AIToolValueSection from './AIToolValueSection.svelte';

	type ToolAccordionItem = { id: string; tool: AIToolCall; index: number };

	let {
		tools,
		value = $bindable([]),
		onValueChange,
		multiple = true,
		scope = 'calls',
		variant = 'ghost',
		toggleIcon = 'none',
		labels,
		formatStatus,
		icon,
		title,
		status,
		content,
		input,
		output,
		error,
		maxDepth,
		maxEntries,
		valueView,
		maxLines,
		theme
	}: {
		tools: readonly AIToolCall[];
		value?: string[];
		onValueChange?: (value: string[]) => void;
		multiple?: boolean;
		scope?: Extract<AIToolAccordionScope, 'single' | 'calls'>;
		variant?: AIToolVariant;
		toggleIcon?: AIToolToggleIcon;
		labels: AIToolLabels;
		formatStatus: (status: AIToolStatus) => string;
		icon?: AIToolSnippet;
		title?: AIToolSnippet;
		status?: AIToolSnippet;
		content?: AIToolSnippet;
		input?: AIToolSnippet;
		output?: AIToolSnippet;
		error?: AIToolSnippet;
		maxDepth: number;
		maxEntries: number;
		valueView?: AIToolValueView;
		maxLines?: number;
		theme?: AIToolThemeProps;
	} = $props();

	const t = $derived(useI18n());
	const items = $derived<ToolAccordionItem[]>(
		tools.map((tool, index) => ({
			id: scope === 'single' ? getAIToolGroupValue([tool]) : getAIToolCallValue(tool, index),
			tool,
			index
		}))
	);
	const classes = $derived(useAIToolTheme(theme));
	const accordionTheme = $derived(
		createAIToolAccordionTheme(classes, { scope, variant, toggleIcon })
	);
	const clock = createAIToolClock(() =>
		items.map((item) => ({ key: item.id, tool: item.tool, status: resolveAIToolStatus(item.tool) }))
	);
</script>

{#snippet toolTitle(payload: { item: ToolAccordionItem })}
	{@const tool = payload.item.tool}
	{@const renderPayload: AIToolRenderPayload = { tool, index: payload.item.index }}
	{@const currentStatus = resolveAIToolStatus(tool)}
	{@const tone = getAIToolStatusTone(currentStatus)}
	{@const statusLabel = formatStatus(currentStatus)}
	{@const summary = getAIToolSummary(tool)}
	{@const elapsed = clock.elapsed(payload.item.id, tool, currentStatus)}
	{@const showWord = tone !== 'success'}
	<div data-slot="ai-tool-call-trigger-content" data-tone={tone} class={classes.title()}>
		{#if icon}
			<span
				data-slot="ai-tool-call-status-indicator"
				role="img"
				aria-label={statusLabel}
				class={classes.indicator({ tone })}
			>
				<Slot render={icon} payload={renderPayload} />
			</span>
		{:else if tool.icon}
			<span data-slot="ai-tool-call-icon" aria-hidden="true" class={classes.indicator()}>
				{@render tool.icon({ size: 16 })}
			</span>
		{:else}
			<AIToolStatusMark status={currentStatus} label={statusLabel} {theme} />
		{/if}
		{#if title}
			<Slot render={title} payload={renderPayload} />
		{:else}
			<span data-slot="ai-tool-call-title" class={classes.name()}>
				{getAIToolTitle(tool, labels.fallbackTitle)}
			</span>
		{/if}
		{#if summary}
			<span data-slot="ai-tool-call-summary" class={classes.summary()}>{summary}</span>
		{/if}
		{#if status}
			<span data-slot="ai-tool-status" class={classes.status()}>
				<Slot render={status} payload={renderPayload} />
			</span>
		{:else if showWord || elapsed !== undefined || (tool.icon && !icon)}
			<span data-slot="ai-tool-call-meta" class={classes.meta()}>
				{#if showWord || (tool.icon && !icon)}
					<span data-slot="ai-tool-call-status" class={classes.statusWord({ tone })}>
						{#if tool.icon && !icon}
							<AIToolStatusMark
								status={currentStatus}
								label={statusLabel}
								decorative={showWord}
								{theme}
							/>
						{/if}
						{#if showWord}{statusLabel}{/if}
					</span>
				{/if}
				{#if elapsed !== undefined}
					<span data-slot="ai-tool-call-duration">{formatAIElapsed(elapsed, t)}</span>
				{/if}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet toolContent(payload: { item: ToolAccordionItem })}
	{@const tool = payload.item.tool}
	{@const index = payload.item.index}
	{@const renderPayload: AIToolRenderPayload = { tool, index }}
	{@const errorValue = getAIToolErrorValue(tool)}
	{@const outputValue = getAIToolOutputValue(tool)}
	{#if content}
		<Slot render={content} payload={renderPayload} />
	{:else}
		<div data-slot="ai-tool-call-panel-content" class={classes.content()}>
			{#if hasRenderableAIToolValue(tool.input)}
				<AIToolValueSection
					{tool}
					{index}
					label={labels.input}
					kind="input"
					value={tool.input}
					snippet={input}
					{maxDepth}
					{maxEntries}
					{valueView}
					{maxLines}
					showAllLabel={labels.showAll}
					showLessLabel={labels.showLess}
					{theme}
				/>
			{/if}

			{#if hasRenderableAIToolValue(errorValue)}
				<AIToolValueSection
					{tool}
					{index}
					label={labels.error}
					kind="error"
					value={errorValue}
					snippet={error ?? output}
					tone="error"
					{maxDepth}
					{maxEntries}
					{valueView}
					{maxLines}
					showAllLabel={labels.showAll}
					showLessLabel={labels.showLess}
					{theme}
				/>
			{:else if hasRenderableAIToolValue(outputValue)}
				<AIToolValueSection
					{tool}
					{index}
					label={labels.output}
					kind="output"
					value={outputValue}
					snippet={output}
					{maxDepth}
					{maxEntries}
					{valueView}
					{maxLines}
					showAllLabel={labels.showAll}
					showLessLabel={labels.showLess}
					{theme}
				/>
			{/if}

			{#if !hasRenderableAIToolValue(tool.input) && !hasRenderableAIToolValue(errorValue) && !hasRenderableAIToolValue(outputValue)}
				<div data-slot="ai-tool-empty" class={classes.empty()}>{labels.empty}</div>
			{/if}
		</div>
	{/if}
{/snippet}

<Accordion
	{items}
	bind:value
	{onValueChange}
	oneAtATime={!multiple}
	title={toolTitle}
	content={toolContent}
	icon={toggleIcon}
	variant="classic"
	density="compact"
	theme={accordionTheme}
/>
