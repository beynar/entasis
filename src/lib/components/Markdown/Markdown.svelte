<script lang="ts">
	import { Streamdown, type StreamdownToken } from 'svelte-streamdown';
	import type { Snippet } from 'svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Card from '../Card/Card.svelte';
	import Code from '../Code/Code.svelte';
	import { Grid, GridSpan } from '../Grid/index.js';
	import Mermaid from '../Mermaid/Mermaid.svelte';
	import Stat from '../Stat/Stat.svelte';
	import { Stack } from '../Stack/index.js';
	import type { MarkdownProps } from './markdown.props.js';
	import {
		buildMarkdownStreamdownTheme,
		markdownCodeSizes,
		markdownMermaidSizes,
		useMarkdownTheme
	} from './markdown.theme.js';

	// `MarkdownProps` is `WithAttachments`, so attachments also arrive in `...rest`.
	// Spreading `rest` onto `<Streamdown>` forwards both extra Streamdown props and
	// those attachments through in one go, which is acceptable here.
	let {
		content,
		size = 'normal',
		class: className,
		theme,
		mdxComponents,
		mdx: customMdx,
		...rest
	}: MarkdownProps = $props();

	const classes = $derived(useMarkdownTheme(theme));
	const streamdownTheme = $derived(buildMarkdownStreamdownTheme(size));
	const t = $derived(useI18n());

	// The `token` carried by the code/mermaid override snippets is a marked
	// `Tokens.Code`; we only need its raw source and language string here.
	type CodePayload = { token: { text: string; lang?: string } };
	type MdxToken = Extract<StreamdownToken, { type: 'mdx' }>;
	type ListItemToken = Extract<StreamdownToken, { type: 'list_item' }>;
	type ListItemPayload = { token: ListItemToken; children: Snippet };
	type MdxAttribute = string | number | boolean | null | undefined;
	type MdxPayload = {
		token: MdxToken;
		children: Snippet;
		props: Record<string, MdxAttribute>;
	};

	const builtInMdxComponents = { Card, Grid, GridSpan, Stack, Stat } as const;
	const blockedMdxProps = new Set([
		'children',
		'class',
		'href',
		'ref',
		'rel',
		'style',
		'target',
		'theme'
	]);

	const getMdxComponent = (tagName: string) =>
		builtInMdxComponents[tagName as keyof typeof builtInMdxComponents];
	const getMdxProps = (props: Record<string, MdxAttribute>): Record<string, MdxAttribute> => {
		const mdxProps: Record<string, MdxAttribute> = {};
		for (const [name, value] of Object.entries(props)) {
			if (blockedMdxProps.has(name) || name.startsWith('on')) continue;
			if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')
				continue;
			mdxProps[name] = value;
		}
		return mdxProps;
	};
</script>

{#snippet renderMdx(payload: MdxPayload)}
	{@const Component = getMdxComponent(payload.token.tagName)}
	{#if Component}
		<Component {...getMdxProps(payload.props)}>
			{@render payload.children()}
		</Component>
	{:else if customMdx}
		{@render customMdx(payload)}
	{:else}
		{@render payload.children()}
	{/if}
{/snippet}

<div class={classes.root({ size, className })}>
	<Streamdown {content} theme={streamdownTheme} {mdxComponents} mdx={renderMdx} {...rest}>
		<!-- Streamdown routes ```mermaid fences through the `code` snippet too (its
		     mermaid branch consults snippets.code), so the mermaid case must be
		     handled here rather than relying solely on a `mermaid` snippet. -->
		{#snippet code(payload: CodePayload)}
			{#if payload.token.lang === 'mermaid'}
				<Mermaid
					chart={payload.token.text}
					errorForgiving
					size={markdownMermaidSizes[size]}
					class={markdownCodeSizes[size].split(' ')[0]}
				/>
			{:else}
				<Code
					code={payload.token.text}
					language={payload.token.lang || 'text'}
					class={markdownCodeSizes[size]}
				/>
			{/if}
		{/snippet}
		<!-- Task-list items own their checkbox, so the default `li` is replaced to name it:
		     the input is disabled and has no text of its own, and an unnamed checkbox is a
		     WCAG label failure. Everything else about the row matches Streamdown's default. -->
		{#snippet li(payload: ListItemPayload)}
			<li
				class={streamdownTheme?.li?.base}
				style:list-style-type={payload.token.task ? 'none' : undefined}
				{...payload.token.value && !payload.token.task ? { value: payload.token.value } : {}}
			>
				{#if payload.token.task}
					<input
						disabled
						type="checkbox"
						checked={payload.token.checked}
						class={streamdownTheme?.li?.checkbox}
						aria-label={payload.token.checked ? t.taskComplete : t.taskIncomplete}
					/>
				{/if}
				{@render payload.children()}
			</li>
		{/snippet}
	</Streamdown>
</div>
