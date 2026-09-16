<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import ToggleButton from '../ToggleButton/ToggleButton.svelte';
	import type { ToggleButtonVariant } from '../ToggleButton/index.js';
	import { useToggleButtonGroupTheme } from '../ToggleButtonGroup/toggleButtonGroup.theme.js';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';
	import type { ToggleMenuGroupButton, ToggleMenuGroupItem } from './toggleMenu.props.js';

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
		onToggle: (payload: { value: string; checked: boolean }) => void;
	} = $props();

	const classes = $derived(useToggleButtonGroupTheme(item.theme));
	const pressed = $derived(item.value ?? item.defaultValue ?? []);

	function getButtonProps(button: ToggleMenuGroupButton) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Strip the group keys before forwarding native toggle props.
		const { value: _value, onValueChange: _onValueChange, ...props } = button;
		return props;
	}
</script>

<div
	role="group"
	aria-label={item.label}
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
	{#each item.items as button (button.value)}
		<ToggleButton
			{...getButtonProps(button)}
			size={item.size ?? size}
			color={item.color ?? color}
			variant={item.variant ?? variant}
			disabled={disabled || !!item.disabled || !!button.disabled}
			value={pressed.includes(button.value)}
			onValueChange={(checked) => onToggle({ value: button.value, checked })}
			{@attach overflowed ? undefined : buttonReference}
			{@attach !button.children && button.label && !overflowed
				? tooltip({ content: button.label, delay: 350 })
				: undefined}
		/>
	{/each}
</div>
