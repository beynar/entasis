<script lang="ts">
	import Button from '../Button/Button.svelte';
	import Code from '../Code/Code.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { AIToolCall, AIToolSnippet, AIToolValueView } from './aiTool.props.js';
	import type { AIToolThemeProps } from './aiTool.theme.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import type { AIToolValueTone } from './aiToolPrimitiveThemes.js';
	import AIToolValueTree from './AIToolValueTree.svelte';
	import {
		buildToolValueTree,
		countToolValueTreeRows,
		getToolErrorSentence,
		toToolJsonValue
	} from './toolValueTree.js';

	let {
		tool,
		index,
		label,
		kind,
		value,
		snippet,
		tone = 'default',
		maxDepth,
		maxEntries,
		valueView = 'json',
		maxLines = 12,
		showAllLabel,
		showLessLabel,
		theme
	}: {
		tool: AIToolCall;
		index: number;
		label: string;
		kind: 'input' | 'output' | 'error';
		value: unknown;
		snippet?: AIToolSnippet;
		tone?: AIToolValueTone;
		maxDepth: number;
		maxEntries: number;
		valueView?: AIToolValueView;
		maxLines?: number;
		showAllLabel: string;
		showLessLabel: string;
		theme?: AIToolThemeProps;
	} = $props();

	const id = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useAIToolTheme(theme));
	let expanded = $state(false);

	// A primitive error is one sentence, not a key/value inspector.
	const errorSentence = $derived(kind === 'error' ? getToolErrorSentence(value) : undefined);
	// Tools often return JSON as text; show it structured. Multi-line strings stay prose; a one-line
	// string is shown quoted like any JSON value, so the output "3" never reads as the number 3.
	const structured = $derived(parseJsonText(value));
	const plainText = $derived(
		typeof structured === 'string' && /[\r\n]/.test(structured) ? structured : undefined
	);
	const presentation = $derived<'text' | 'tree' | 'json'>(
		plainText !== undefined ? 'text' : valueView === 'tree' ? 'tree' : 'json'
	);
	const treeNodes = $derived(
		presentation === 'tree' ? buildToolValueTree(structured, maxDepth, maxEntries, t) : []
	);
	const codeText = $derived(
		presentation === 'text'
			? (plainText ?? '')
			: presentation === 'json'
				? stringify(toToolJsonValue(structured, maxDepth, maxEntries, t))
				: ''
	);
	const lineCount = $derived(
		presentation === 'tree' ? countToolValueTreeRows(treeNodes) : countLines(codeText)
	);
	const lineLimit = $derived(Math.max(1, Math.floor(maxLines)));
	const collapsible = $derived(lineCount > lineLimit);
	const collapsed = $derived(collapsible && !expanded);
	const codeTheme = $derived({
		root: { base: classes.code({ tone }) },
		container: { base: classes.codeContainer() }
	});

	function parseJsonText(input: unknown): unknown {
		if (typeof input !== 'string') return input;
		const trimmed = input.trim();
		if (!/^[[{]/.test(trimmed)) return input;
		try {
			return JSON.parse(trimmed) as unknown;
		} catch {
			return input;
		}
	}

	function stringify(input: unknown): string {
		return JSON.stringify(input, null, 2) ?? 'null';
	}

	function countLines(text: string): number {
		let count = 1;
		for (
			let position = text.indexOf('\n');
			position !== -1;
			position = text.indexOf('\n', position + 1)
		) {
			count += 1;
		}
		return count;
	}
</script>

<section
	data-slot={tone === 'error' ? 'ai-tool-error' : 'ai-tool-value'}
	data-tone={tone}
	data-kind={kind}
	aria-labelledby={`${id}-label`}
	class={classes.section({ tone })}
>
	<div id={`${id}-label`} data-slot="ai-tool-value-label" class={classes.label({ tone })}>
		{label}
	</div>
	{#if snippet}
		<Slot render={snippet} payload={{ tool, index }} />
	{:else if errorSentence !== undefined}
		<p data-slot="ai-tool-error-message" class={classes.errorMessage()}>{errorSentence}</p>
	{:else}
		<div
			id={`${id}-value`}
			data-slot="ai-tool-value-content"
			data-view={presentation}
			data-collapsed={collapsed || undefined}
			class={classes.clamp({ collapsed })}
			style:max-height={collapsed ? `calc(${lineLimit} * 1lh + 1.5rem)` : undefined}
		>
			{#if presentation === 'tree'}
				<AIToolValueTree nodes={treeNodes} {tone} {theme} />
			{:else}
				<Code
					code={codeText}
					language={presentation === 'json' ? 'json' : 'text'}
					showHeader={false}
					wrap
					theme={codeTheme}
				/>
			{/if}
		</div>
		{#if collapsible}
			<Button
				type="button"
				variant="ghost"
				color="neutral"
				size="small"
				class={classes.showAll()}
				{expanded}
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? showLessLabel : showAllLabel}
			</Button>
		{/if}
	{/if}
</section>
