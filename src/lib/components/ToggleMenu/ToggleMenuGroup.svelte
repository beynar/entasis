<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import ToggleButton from '../ToggleButton/ToggleButton.svelte';
	import type { ToggleButtonVariant } from '../ToggleButton/index.js';
	import { useToggleButtonGroupTheme } from '../ToggleButtonGroup/toggleButtonGroup.theme.js';
	import { tooltip } from '../Tooltip/tooltip.svelte.js';
	import type { ToggleMenuGroupItem } from './toggleMenu.props.js';

	let {
		item,
		size,
		color,
		variant,
		disabled,
		overflowed,
		unitClass,
		unitReference,
		buttonReference,
		onToggle
	}: {
		item: ToggleMenuGroupItem;
		size?: Sizes;
		color?: Colors;
		variant?: ToggleButtonVariant;
		disabled: boolean;
		overflowed: boolean;
		unitClass: string;
		unitReference: Attachment<HTMLElement>;
		buttonReference?: Attachment<HTMLElement>;
		onToggle: (payload: { key: string; value: boolean }) => void;
	} = $props();

	const classes = $derived(useToggleButtonGroupTheme(item.theme));
</script>

<div
	role="group"
	aria-label={item.ariaLabel}
	aria-hidden={overflowed || undefined}
	inert={overflowed || undefined}
	data-overflowed={overflowed || undefined}
	data-color={item.color ?? color}
	class={classes.root({
		joined: item.joined ?? true,
		className: [unitClass, item.class].filter(Boolean).join(' ')
	})}
	{@attach unitReference}
>
	{#each Object.entries(item.items) as [key, button]}
		<ToggleButton
			{...button}
			size={item.size ?? size}
			color={item.color ?? color}
			variant={item.variant ?? variant}
			disabled={disabled || !!item.disabled || !!button.disabled}
			value={item.value?.[key] ?? item.defaultValue?.[key] ?? false}
			onValueChange={(value) => onToggle({ key, value })}
			{@attach overflowed ? undefined : buttonReference}
			{@attach !button.children && button.ariaLabel && !overflowed
				? tooltip({ content: button.ariaLabel, delay: 350 })
				: undefined}
		/>
	{/each}
</div>
