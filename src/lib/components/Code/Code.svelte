<script lang="ts">
	import type { CodeProps } from './code.props.js';
	import { useCodeTheme } from './code.theme.js';
	import { codeToHtml } from './code.highlighter.js';
	import { resolveLanguage, getLanguageLabel } from './highlighter/code-languages.js';
	import Slot from '../Slot/Slot.svelte';
	import CodeTheme from './CodeTheme.svelte';
	import Button from '../Button/Button.svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import { copyIcon } from '../Icons/copy.js';
	import { checkIcon } from '../Icons/check.js';
	import { useClipboard } from '$lib/utils/useClipboard.svelte.js';

	let {
		code,
		language = 'text',
		title,
		showLineNumbers = false,
		showHeader = true,
		copyable = true,
		wrap = false,
		maxHeight,
		tabSize = 2,
		header,
		footer,
		class: className,
		theme,
		...attachments
	}: CodeProps = $props();

	const classes = $derived(useCodeTheme(theme));

	const resolvedLanguage = $derived(resolveLanguage(language));
	const label = $derived(title ?? getLanguageLabel(language));

	const highlightedHtml = $derived(
		codeToHtml(code, { language, lineNumbers: showLineNumbers, wrap })
	);

	const maxHeightCss = $derived(typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight);
	// A floating copy button covers the "code only" case (no header row) where copy would
	// otherwise be unreachable.

	const clipboard = useClipboard();
	const copy = () => clipboard.copy(code);

	// Clear the "copied" feedback whenever the displayed block changes.
	$effect(() => {
		code;
		language;
		showLineNumbers;
		clipboard.reset();
	});
</script>

<CodeTheme />

{#snippet copyButton()}
	<Button
		variant="ghost"
		color="neutral"
		size="small"
		squared
		onclick={copy}
		label={clipboard.copied ? 'Copied' : 'Copy'}
	>
		{#if clipboard.copied}
			{@render checkIcon({ size: 14 })}
		{:else}
			{@render copyIcon({ size: 14 })}
		{/if}
	</Button>
{/snippet}

{#snippet codeBody()}
	<div class={classes.container()}>
		{@html highlightedHtml}
	</div>
{/snippet}

<div
	data-slot="code"
	class={classes.root({ className })}
	style:--code-tab-size={tabSize}
	style:--code-max-height={maxHeightCss}
	{...attachments}
>
	{#if header}
		<Slot
			render={header}
			class={classes.header()}
			payload={{ language: resolvedLanguage, label, copied: clipboard.copied, copy }}
		/>
	{:else if showHeader}
		<div class={classes.header()}>
			<span class={classes.title()}>{label}</span>
			{#if copyable}
				{@render copyButton()}
			{/if}
		</div>
	{/if}

	{#if copyable && !header && !showHeader}
		<div class={classes.floatingCopy()}>
			{@render copyButton()}
		</div>
	{/if}

	<!-- ScrollArea owns both axes: horizontal (long lines) natively, vertical when maxHeight caps
	     the height. Its viewport is the focusable native scroll region (keyboard + focus ring). -->
	<ScrollArea type="hover" class="flex max-h-[var(--code-max-height)] flex-col rounded-b-lg">
		{@render codeBody()}
	</ScrollArea>

	{#if footer}
		<Slot
			render={footer}
			class={classes.footer()}
			payload={{ language: resolvedLanguage, label, copied: clipboard.copied, copy }}
		/>
	{/if}
</div>
