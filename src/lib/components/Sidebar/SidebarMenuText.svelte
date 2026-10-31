<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SidebarSize } from './sidebar.props.js';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		label,
		description,
		meta,
		size,
		suffix = false,
		trailing,
		theme
	}: {
		label: string;
		description?: string | Snippet;
		/** Left out while the Sidebar is collapsed to icons. */
		meta?: string | Snippet;
		size: SidebarSize;
		/** The row has a suffix, centred on the description's line. */
		suffix?: boolean;
		/** End of the description's line: the row's badge. */
		trailing?: Snippet;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
</script>

{#snippet text(content: string | Snippet)}
	{#if typeof content === 'string'}{content}{:else}{@render content()}{/if}
{/snippet}

<!-- The label's line (the label, then the meta at its end) over the description's line. -->
<span data-slot="sidebar-menu-text" class={classes.menuText()}>
	<span class={classes.menuTitleRow()}>
		<span data-slot="sidebar-menu-label" class={classes.menuTitle()}>{label}</span>
		{#if meta != null}
			<span
				data-slot="sidebar-menu-meta"
				data-sidebar="menu-meta"
				class={classes.menuMeta({ size })}
			>
				{@render text(meta)}
			</span>
		{/if}
	</span>
	{#if description != null}
		<span class={classes.menuDescriptionRow({ suffix })}>
			<span
				data-slot="sidebar-menu-description"
				data-sidebar="menu-description"
				class={classes.menuSecondary({ size })}
			>
				{@render text(description)}
			</span>
			{@render trailing?.()}
		</span>
	{/if}
</span>
