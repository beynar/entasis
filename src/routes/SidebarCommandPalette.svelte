<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { Command } from '$lib/components/Command/index.js';
	import type { SidebarGroup } from '$lib/components/Sidebar/index.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { getSidebarCommandGroups } from './getSidebarCommandGroups.js';

	let {
		groups,
		collapsed = false
	}: {
		groups: SidebarGroup[];
		collapsed?: boolean;
	} = $props();

	const commandGroups = $derived(getSidebarCommandGroups(groups));
</script>

<Command
	dialog
	shortcut="k"
	items={commandGroups}
	title="Search pages"
	placeholder="Search pages..."
	size="normal"
>
	{#snippet trigger({ open })}
		<Button
			prefix={magnifyingGlassIcon}
			label={collapsed ? 'Search pages' : undefined}
			color="neutral"
			squared={collapsed}
			fullWidth={!collapsed}
			class={collapsed ? 'mx-auto' : 'justify-start'}
			onclick={() => open()}
			size="large"
		>
			{#if !collapsed}
				<span class="min-w-0 flex-1 truncate text-left">Search pages</span>
				<span
					aria-hidden="true"
					class="border-neutral-muted bg-neutral-muted text-neutral/60 ml-auto rounded border px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-widest"
				>
					⌘K
				</span>
			{/if}
		</Button>
	{/snippet}

	{#snippet footer({ close })}
		<div
			class="border-neutral-muted text-neutral/60 mt-1 flex items-center gap-3 border-t px-3 py-2 text-xs"
		>
			<span>Enter to open</span>
			<span>Esc to close</span>
			<button type="button" class="ml-auto hover:text-neutral" onclick={() => close()}>
				Close
			</button>
		</div>
	{/snippet}
</Command>
