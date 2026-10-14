<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import { itemStateAttributes } from '$lib/utils/stateAttributes.js';
	import { getNavigationMenuState } from './navigationMenu.state.svelte.js';
	import type {
		NavigationMenuItem,
		NavigationMenuLink,
		NavigationMenuPanel
	} from './navigationMenu.props.js';
	import type { useNavigationMenuTheme } from './navigationMenu.theme.js';

	type Classes = ReturnType<typeof useNavigationMenuTheme>;

	let {
		item,
		size,
		density,
		classes
	}: {
		item: NavigationMenuPanel<string>;
		size: Sizes;
		density: Density;
		classes: Classes;
	} = $props();

	const menu = getNavigationMenuState();
	const rootId = $derived(menu.panelId(item.value));

	function pressDisabled(event: MouseEvent) {
		event.preventDefault();
	}
</script>

{#snippet linkRow(link: NavigationMenuLink)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
	<a
		href={link.disabled ? undefined : link.href}
		target={link.target}
		rel={link.rel}
		role={link.disabled ? 'link' : undefined}
		aria-disabled={link.disabled ? 'true' : undefined}
		aria-current={link.active ? 'page' : undefined}
		tabindex={link.disabled ? -1 : undefined}
		data-slot="navigation-menu-content-link"
		{...itemStateAttributes({ selected: link.active, disabled: link.disabled })}
		class={classes.contentLink({ size, density, active: !!link.active, disabled: !!link.disabled })}
		onclick={link.disabled ? pressDisabled : composeHandlers(link.onclick, menu.pressLink)}
	>
		{#if link.prefix}
			<span class={classes.contentPrefix()}><Slot render={link.prefix} /></span>
		{/if}
		<span class={classes.contentText()}>
			<span class={classes.contentTitle()}><Slot render={link.label} /></span>
			{#if link.description}
				<span class={classes.contentDescription()}><Slot render={link.description} /></span>
			{/if}
		</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

{#snippet body(entry: NavigationMenuPanel<string>, path: string, depth: number)}
	{#if Array.isArray(entry.content)}
		<ul class={classes.contentList({ density, nested: depth > 0 })}>
			{#each entry.content as link, index (index)}
				<li>{@render linkRow(link)}</li>
			{/each}
		</ul>
	{:else if entry.content}
		{@render entry.content({ close: () => menu.close() })}
	{/if}
	{#if entry.items?.length}
		{@render level(entry.items, path, depth + 1)}
	{/if}
{/snippet}

{#snippet level(entries: NavigationMenuItem<string>[], path: string, depth: number)}
	<ul class={classes.contentList({ density, nested: depth > 0 })}>
		{#each entries as entry, index (entry.type === 'panel' ? `panel:${entry.value}` : `link:${index}`)}
			<li>
				{#if entry.type === 'link'}
					{@render linkRow(entry)}
				{:else}
					{@const nestedPath = `${path}-${index}`}
					{@const nestedId = `${rootId}-${nestedPath}`}
					{@const expanded = menu.nestedOpen.has(entry.value)}
					<button
						type="button"
						id={`${nestedId}-trigger`}
						disabled={entry.disabled}
						aria-expanded={expanded}
						aria-controls={expanded || menu.keepMounted ? nestedId : undefined}
						data-slot="navigation-menu-nested-trigger"
						{...itemStateAttributes({ disabled: entry.disabled })}
						class={classes.nestedTrigger({ size, density, disabled: !!entry.disabled })}
						onclick={() => {
							if (expanded) menu.nestedOpen.delete(entry.value);
							else menu.nestedOpen.add(entry.value);
						}}
					>
						<span class={classes.contentTitle()}><Slot render={entry.label} /></span>
						<span aria-hidden="true" class={classes.caret({ open: expanded })}>
							{@render caretDownIcon({ size: 16 })}
						</span>
					</button>
					{#if expanded || menu.keepMounted}
						<div id={nestedId} hidden={!expanded}>
							{@render body(entry, nestedPath, depth + 1)}
						</div>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{@render body(item, 'n', 0)}
