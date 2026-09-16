<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import type { MenuItem } from '../Menu/index.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useToggleButtonTheme, type ToggleButtonVariant } from '../ToggleButton/index.js';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';
	import type { ToggleMenuMenuItem } from './toggleMenu.props.js';

	let {
		item,
		menuItems,
		size,
		color,
		variant,
		disabled,
		overflowed,
		unitClass,
		unitReference,
		buttonReference
	}: {
		item: ToggleMenuMenuItem;
		menuItems: MenuItem[];
		size?: Sizes;
		color?: Colors;
		variant?: ToggleButtonVariant;
		disabled: boolean;
		overflowed: boolean;
		unitClass: string;
		unitReference: Attachment<HTMLElement>;
		buttonReference?: Attachment<HTMLElement>;
	} = $props();

	let open = $state(false);
	const classes = $derived(useToggleButtonTheme(item.theme));
	const resolvedSize = $derived(item.size ?? size ?? 'normal');
	const resolvedColor = $derived(item.color ?? color ?? 'neutral');
	const resolvedVariant = $derived(item.variant ?? variant ?? 'ghost');
	const isDisabled = $derived(disabled || !!item.disabled);
	const isSquared = $derived(
		!item.children && ((!item.suffix && !!item.prefix) || (!item.prefix && !!item.suffix))
	);

	$effect(() => {
		if (overflowed) open = false;
	});
</script>

<span
	aria-hidden={overflowed || undefined}
	inert={overflowed || undefined}
	data-overflowed={overflowed || undefined}
	class={unitClass}
	{@attach unitReference}
>
	<PopupMenu
		bind:open
		menu={{ items: menuItems }}
		closeOnItemClick={item.closeOnItemClick ?? true}
		position="bottom"
		fitTrigger={false}
	>
		{#snippet trigger(popover)}
			<button
				type="button"
				aria-label={item.label}
				aria-haspopup="menu"
				aria-expanded={popover.isOpen}
				data-color={resolvedColor}
				data-checked="false"
				disabled={isDisabled}
				class={classes.root({
					color: resolvedColor,
					checked: false,
					squared: isSquared,
					variant: resolvedVariant,
					size: resolvedSize,
					disabled: isDisabled,
					className: item.class
				})}
				{@attach overflowed ? undefined : buttonReference}
				{@attach overflowed ? undefined : popover.reference}
				{@attach !item.children && item.label && !popover.isOpen && !overflowed
					? tooltip({ content: item.label, delay: 350 })
					: undefined}
				onclick={() => popover.toggle()}
			>
				<Slot render={item.prefix} class={classes.prefix({ size: resolvedSize, checked: false })} />
				<Slot render={item.children} />
				<Slot render={item.suffix} class={classes.suffix({ size: resolvedSize, checked: false })} />
			</button>
		{/snippet}
	</PopupMenu>
</span>
