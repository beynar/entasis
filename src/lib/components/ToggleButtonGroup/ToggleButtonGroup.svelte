<script
	lang="ts"
	generics="Items extends ToggleButtonGroupItems = ToggleButtonGroupItems, Type extends ToggleButtonGroupType = 'multiple'"
>
	import ToggleButton from '../ToggleButton/ToggleButton.svelte';
	import type {
		ToggleButtonGroupItem,
		ToggleButtonGroupItems,
		ToggleButtonGroupProps,
		ToggleButtonGroupType,
		ToggleButtonGroupValue
	} from './toggleButtonGroup.props.js';
	import { useToggleButtonGroupTheme } from './toggleButtonGroup.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';

	type Value = ToggleButtonGroupValue<Items, Type>;

	let {
		items,
		label,
		size,
		defaultValue,
		value = $bindable(),
		color,
		variant,
		disabled,
		joined = false,
		type = 'multiple' as Type,
		theme,
		class: className,
		onValueChange,
		...attachments
	}: ToggleButtonGroupProps<Items, Type> = $props();
	const valueState = createBindableValue<Value>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue ?? ((type === 'single' ? undefined : []) as Value)
	);

	const classes = $derived(useToggleButtonGroupTheme(theme));
	const id = $props.id();
	// One tab stop for the whole group; arrows move between buttons (Radix ToggleGroup / Toolbar).
	const navigation = useNavigation({
		orientation: 'horizontal',
		loop: true,
		id,
		enableHoverFocus: false
	});

	const pressed = $derived.by(() => {
		const current = valueState.value as string[] | string | undefined;
		if (Array.isArray(current)) return current;
		return current === undefined ? [] : [current];
	});

	function getButtonProps(item: ToggleButtonGroupItem) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Strip the group keys before forwarding native toggle props.
		const { value: _value, onValueChange: _onValueChange, ...props } = item;
		return props;
	}

	const toggle = (itemValue: string, checked: boolean) => {
		const nextValue = (
			type === 'single'
				? itemValue
				: items
						.filter((item) => (item.value === itemValue ? checked : pressed.includes(item.value)))
						.map((item) => item.value)
		) as Value;
		valueState.value = nextValue;
		onValueChange?.(nextValue);
	};
</script>

<div
	role={type === 'single' ? 'radiogroup' : 'group'}
	aria-label={label}
	data-color={color}
	data-type={type}
	class={classes.root({ className, joined })}
	{@attach navigation.containerReference}
	{...attachments}
>
	{#each items as item (item.value)}
		<ToggleButton
			{size}
			{color}
			{variant}
			{...getButtonProps(item)}
			role={type === 'single' ? 'radio' : undefined}
			disabled={disabled || item.disabled}
			bind:value={
				() => pressed.includes(item.value),
				(checked) => {
					// A radio cannot be unchecked by pressing it again.
					if (type === 'single' && !checked) return;
					item.onValueChange?.(checked);
					toggle(item.value, checked);
				}
			}
			{@attach navigation.itemReference}
		/>
	{/each}
</div>
