<script lang="ts">
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import Slot from '../../Slot/Slot.svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { Slot as SlotContent } from '../../Slot/slot.js';
	import type { CheckboxMode } from './checkboxesInput.props.js';
	import type { useCheckboxesInputTheme } from './checkboxesInput.theme.js';
	import type { Sizes } from '$lib/types/theme.js';

	type CheckboxLineClasses = ReturnType<typeof useCheckboxesInputTheme>;

	let {
		id,
		name,
		inputValue = 'on',
		checked = false,
		indeterminate = false,
		disabled = false,
		mode = 'normal',
		size = 'normal',
		label,
		description,
		classes,
		ref = $bindable(null),
		onCheckedChange,
		onFocus,
		onBlur
	}: {
		id: string;
		name?: string;
		inputValue?: string;
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		mode?: CheckboxMode | 'control';
		size?: Sizes;
		label?: SlotContent;
		description?: SlotContent;
		classes: CheckboxLineClasses;
		ref?: HTMLElement | null;
		onCheckedChange: (checked: boolean) => void;
		onFocus?: () => void;
		onBlur?: () => void;
	} = $props();

	const toggle = () => {
		if (disabled) return;
		onCheckedChange(indeterminate || !checked);
	};

	// `control` is the compact, label-less checkbox: a string name is spoken rather than painted,
	// so the row keeps its accessible name without growing visible text.
	const hiddenLabel = $derived(mode === 'control' && typeof label === 'string' ? label : undefined);

	const syncIndeterminate: Attachment<HTMLInputElement> = (element) => {
		$effect(() => {
			element.indeterminate = indeterminate;
		});
	};
</script>

<button
	bind:this={ref}
	{id}
	type="button"
	role="checkbox"
	aria-label={hiddenLabel}
	aria-checked={indeterminate ? 'mixed' : checked}
	{disabled}
	data-state={indeterminate ? 'mixed' : checked ? 'checked' : 'unchecked'}
	onclick={toggle}
	onfocus={onFocus}
	onblur={onBlur}
	class={classes.checkboxesInputItem({ mode, checked, disabled, size })}
>
	<input
		hidden
		onchange={toggle}
		style="transform: scale(0); opacity: 0; pointer-events: none; margin: -1px; position: absolute;"
		type="checkbox"
		{checked}
		{@attach syncIndeterminate}
		{name}
		id={`${id}-input`}
		value={inputValue}
		{disabled}
	/>

	<div
		class={classes.checkboxesInputItemTrack({
			mode,
			checked: checked || indeterminate,
			disabled,
			size
		})}
	></div>

	<div
		class={classes.checkboxesInputItemThumb({
			checked: checked || indeterminate,
			mode,
			disabled,
			size
		})}
	>
		{#if indeterminate}
			{@render minusIcon({ size: 40 })}
		{:else}
			{@render checkIcon({ size: 40 })}
		{/if}
	</div>

	{#if !hiddenLabel}
		<Slot render={label} class={classes.checkboxesInputItemLabel({ size })} />
	{/if}
	<Slot render={description} class={classes.checkboxesInputItemDescription({ mode, checked })} />
</button>
