<script lang="ts">
	import { signInIconBold } from '../Icons/signIn.js';
	import { signOutIconBold } from '../Icons/signOut.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';
	import type { AIToolCall, AIToolSnippet } from './aiTool.props.js';
	import type { AIToolThemeProps } from './aiTool.theme.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import { createAIToolScrollAreaTheme, type AIToolValueTone } from './aiToolPrimitiveThemes.js';
	import AIToolValueTree from './AIToolValueTree.svelte';

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
		theme?: AIToolThemeProps;
	} = $props();

	const classes = $derived(useAIToolTheme(theme));
	const scrollAreaTheme = $derived(createAIToolScrollAreaTheme(classes, tone));
</script>

<section
	data-slot={tone === 'error' ? 'ai-tool-error' : 'ai-tool-value'}
	data-tone={tone}
	data-kind={kind}
	class={classes.section({ tone })}
>
	{#if kind === 'input' || kind === 'output'}
		<span
			data-slot="ai-tool-value-label"
			role="img"
			aria-label={label}
			class={classes.label({ tone, kind: 'icon' })}
			{@attach tooltip({ content: label, position: 'top', size: 'small', delay: 350 })}
		>
			{@render (kind === 'input' ? signInIconBold : signOutIconBold)({
				size: 14,
				'aria-hidden': 'true'
			})}
		</span>
	{:else}
		<div data-slot="ai-tool-value-label" class={classes.label({ tone, kind: 'text' })}>
			{label}
		</div>
	{/if}
	{#if snippet}
		<Slot render={snippet} payload={{ tool, index }} />
	{:else}
		<ScrollArea type="hover" label={`${label} details`} theme={scrollAreaTheme}>
			<AIToolValueTree {value} {tone} {maxDepth} {maxEntries} {theme} />
		</ScrollArea>
	{/if}
</section>
