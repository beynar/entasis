<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import Slot from '../Slot/Slot.svelte';
	import type { ToggleButtonVariant } from '../ToggleButton/index.js';
	import { useToggleButtonTheme } from '../ToggleButton/toggleButton.theme.js';
	import { useToggleButtonGroupTheme } from '../ToggleButtonGroup/toggleButtonGroup.theme.js';
	import { tooltip } from '../Tooltip/tooltip.svelte.js';
	import type { ToggleMenuRadioGroupButton, ToggleMenuRadioGroupItem } from './toggleMenu.props.js';

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
		onValueChange
	}: {
		item: ToggleMenuRadioGroupItem;
		size?: Sizes;
		color?: Colors;
		variant?: ToggleButtonVariant;
		disabled: boolean;
		overflowed: boolean;
		unitClass: string;
		unitReference: Attachment<HTMLElement>;
		buttonReference?: Attachment<HTMLElement>;
		onValueChange: (value: string) => void;
	} = $props();

	const groupClasses = $derived(useToggleButtonGroupTheme(item.theme));
	const buttonClasses = $derived(useToggleButtonTheme());

	function isSquared(button: ToggleMenuRadioGroupButton) {
		return !!(
			(!button.children && button.prefix && !button.suffix) ||
			(!button.children && !button.prefix && button.suffix)
		);
	}
</script>

<div
	role="radiogroup"
	aria-label={item.ariaLabel}
	aria-hidden={overflowed || undefined}
	inert={overflowed || undefined}
	data-overflowed={overflowed || undefined}
	data-color={item.color ?? color}
	class={groupClasses.root({
		joined: item.joined ?? true,
		className: [unitClass, item.class].filter(Boolean).join(' ')
	})}
	{@attach unitReference}
>
	{#each Object.entries(item.items) as [key, button]}
		{@const resolvedSize = item.size ?? size ?? 'normal'}
		{@const resolvedColor = item.color ?? color ?? 'neutral'}
		{@const resolvedVariant = item.variant ?? variant ?? 'ghost'}
		{@const isDisabled = disabled || !!item.disabled || !!button.disabled}
		{@const isChecked = (item.value ?? item.defaultValue) === key}
		<button
			type="button"
			role="radio"
			aria-label={button.ariaLabel}
			aria-checked={isChecked}
			data-color={resolvedColor}
			data-checked={isChecked}
			disabled={isDisabled}
			class={buttonClasses.root({
				color: resolvedColor,
				checked: isChecked,
				squared: isSquared(button),
				variant: resolvedVariant,
				size: resolvedSize,
				disabled: isDisabled,
				className: button.class
			})}
			onclick={() => onValueChange(key)}
			{@attach overflowed ? undefined : buttonReference}
			{@attach !button.children && button.ariaLabel && !overflowed
				? tooltip({ content: button.ariaLabel, delay: 350 })
				: undefined}
		>
			<Slot
				render={button.prefix}
				class={buttonClasses.prefix({ size: resolvedSize, checked: isChecked })}
			/>
			<Slot render={button.children} />
			<Slot
				render={button.suffix}
				class={buttonClasses.suffix({ size: resolvedSize, checked: isChecked })}
			/>
		</button>
	{/each}
</div>
