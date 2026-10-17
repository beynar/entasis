<script lang="ts">
	import type { AIToolValueTreeNode } from './toolValueTree.js';
	import { useAIToolTheme } from './aiTool.theme.js';
	import type { AIToolThemeProps } from './aiTool.theme.js';

	let {
		nodes,
		tone = 'default',
		theme
	}: {
		nodes: readonly AIToolValueTreeNode[];
		tone?: 'default' | 'error';
		theme?: AIToolThemeProps;
	} = $props();
	const classes = $derived(useAIToolTheme(theme));
</script>

{#snippet treeNode(node: AIToolValueTreeNode)}
	<li data-slot="ai-tool-value-tree-node" class={classes.treeNode()}>
		{#if node.kind === 'branch'}
			<div data-slot="ai-tool-value-tree-branch" class={classes.treeBranch()}>
				{#if node.key}<span data-slot="ai-tool-value-tree-key" class={classes.treeKey()}
						>{node.key}</span
					>{/if}<span data-slot="ai-tool-value-tree-summary" class={classes.treeSummary()}
					>{node.summary}</span
				>
			</div>
			<ul data-slot="ai-tool-value-tree-children" class={classes.treeChildren()}>
				{#each node.children as child, index (`${child.key}-${index}`)}{@render treeNode(
						child
					)}{/each}
			</ul>
		{:else}
			<div data-slot="ai-tool-value-tree-leaf" class={classes.treeLeaf({ keyed: node.key !== '' })}>
				{#if node.key}<span data-slot="ai-tool-value-tree-key" class={classes.treeKey()}
						>{node.key}</span
					>{/if}<span
					data-slot="ai-tool-value-tree-value"
					class={classes.treeValue({ kind: node.valueKind, tone })}>{node.value}</span
				>
			</div>
		{/if}
	</li>
{/snippet}

<ul data-slot="ai-tool-value-tree" class={classes.tree({ tone })}>
	{#each nodes as node, index (`${node.key}-${index}`)}{@render treeNode(node)}{/each}
</ul>
