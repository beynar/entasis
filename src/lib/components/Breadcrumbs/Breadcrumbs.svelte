<script lang="ts" generics="const Items extends BreadcrumbItem[] = BreadcrumbItem[]">
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { BreadcrumbsProps, BreadcrumbItem } from './breadcrumbs.props.js';
	import { useBreadcrumbsTheme } from './breadcrumbs.theme.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import type { MenuItem } from '../Menu/index.js';

	let {
		items,
		item: itemSlot,
		home,
		maxItems,
		showSeparator = true,
		separator,
		ellipsisIcon,
		ellipsis,
		class: className,
		theme,
		...attachments
	}: BreadcrumbsProps<Items> = $props();

	const classes = $derived(useBreadcrumbsTheme(theme));

	const navigation = useNavigation({
		orientation: 'horizontal',
		loop: true
	});

	// Build the items array with ellipsis if needed
	// Returns an array where the first item might be an ellipsis with a menu of hidden items
	const displayItems = $derived.by((): BreadcrumbItem[] => {
		const homeItem: Items[number] | undefined = home
			? {
					...home,
					label: home.label || houseIcon.withProps({ size: 16 })
				}
			: undefined;

		// If no maxItems or items fit within limit, return all items
		if (!maxItems || items.length <= maxItems) {
			return homeItem ? [homeItem].concat(items) : items;
		}

		// Build ellipsis menu item with all hidden items
		const hiddenItems = items.slice(0, -maxItems);
		const visibleItems = items.slice(-maxItems);

		// Convert hidden items to menu format
		const menuItems = hiddenItems.map((item) => {
			return {
				type: 'option' as const,
				children: typeof item.label === 'string' ? item.label : item.label,
				href: item.href,
				disabled: item.disabled || item.active,
				onclick: item.onclick
			} satisfies MenuItem;
		});

		// Create ellipsis item with menu
		const ellipsisItem: BreadcrumbItem = {
			label: ellipsisIcon || dotsThreeIcon.withProps({ size: 16 }),
			menu: menuItems
		};

		return homeItem
			? [homeItem].concat([ellipsisItem, ...visibleItems])
			: [ellipsisItem, ...visibleItems];
	});
</script>

<nav
	aria-label="Breadcrumbs"
	class={classes.root({ className })}
	{@attach navigation.containerReference}
	{...attachments}
>
	<ol class="flex flex-wrap items-center">
		{#each displayItems as item, i}
			<li
				class={classes.item({
					disabled: item.disabled,
					active: item.active
				})}
			>
				{#if item.menu && item.menu.length > 0}
					{#if ellipsis}
						{@render ellipsis(item.menu)}
					{:else}
						<PopupMenu menu={{ items: item.menu }}>
							{#snippet trigger(popover)}
								<button
									type="button"
									disabled={item.disabled || item.active}
									class={classes.link()}
									{@attach navigation.itemReference}
									{@attach popover.reference}
									onclick={(e) => {
										e.preventDefault();
										if (item.disabled || item.active) return;
										popover.toggle();
									}}
								>
									<Slot
										as="span"
										render={item.label}
										class={classes.ellipsis()}
										attrs={{
											role: 'presentation',
											'aria-hidden': true
										}}
									>
										<span class="sr-only">More</span>
									</Slot>
								</button>
							{/snippet}
						</PopupMenu>
					{/if}
				{:else}
					<svelte:element
						this={item.active ? 'span' : item.href ? 'a' : 'button'}
						role={item.active ? 'link' : item.href ? 'link' : 'button'}
						onclick={(event: MouseEvent) => {
							if (item.disabled || item.active) {
								event.preventDefault();
								event.stopPropagation();
								return;
							}
							item.onclick?.(event);
						}}
						class={classes.link({ disabled: item.disabled, active: item.active })}
						href={item.disabled || item.active ? undefined : item.href}
						type={!item.active && !item.href ? 'button' : undefined}
						disabled={!item.active && !item.href && item.disabled ? true : undefined}
						tabindex={item.disabled || item.active ? -1 : undefined}
						aria-disabled={item.disabled || item.active}
						aria-current={item.active ? 'page' : undefined}
						data-disabled={item.disabled || item.active ? true : undefined}
						{@attach navigation.itemReference}
					>
						{#if itemSlot}
							{@render itemSlot(item)}
						{:else}
							{#if item.icon}
								<Slot render={item.icon} class={classes.icon({ size: 'normal' })} />
							{/if}
							<Slot render={item.label} />
						{/if}
					</svelte:element>
				{/if}
			</li>
			{#if i < displayItems.length - 1 && showSeparator}
				<Slot
					as="li"
					attrs={{ role: 'presentation', 'aria-hidden': true }}
					render={separator || caretRightIcon.withProps({ size: 16 })}
					payload={{}}
					class={classes.separator()}
				/>
			{/if}
		{/each}
	</ol>
</nav>
