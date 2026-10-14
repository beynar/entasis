<script lang="ts">
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import Slot from '../../Slot/Slot.svelte';
	import type { Slot as SlotContent } from '../../Slot/slot.js';
	import type { CheckboxMode } from './checkboxesInput.props.js';
	import type { useCheckboxesInputTheme } from './checkboxesInput.theme.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { FieldButtonAttributes } from '../Field/field.js';

	type CheckboxLineClasses = ReturnType<typeof useCheckboxesInputTheme>;

	let {
		id,
		checked = false,
		indeterminate = false,
		disabled = false,
		readOnly = false,
		mode = 'normal',
		size = 'normal',
		label,
		description,
		classes,
		ref = $bindable(null),
		onCheckedChange,
		onFocus,
		onBlur,
		onEnter,
		attrs,
		controls
	}: {
		id: string;
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		readOnly?: boolean;
		mode?: CheckboxMode | 'control';
		size?: Sizes;
		label?: SlotContent;
		description?: SlotContent;
		classes: CheckboxLineClasses;
		ref?: HTMLElement | null;
		onCheckedChange: (checked: boolean) => void;
		onFocus?: () => void;
		onBlur?: () => void;
		/** A plain Enter key press, after the consumer's own `onkeydown`; Enter never toggles. */
		onEnter?: (event: KeyboardEvent & { currentTarget: HTMLButtonElement }) => void;
		/** Ids of the elements this row controls (a select-all row lists its options). */
		controls?: string;
		/** Native attributes from the owner's `inputAttrs`; its handlers run before the built-in ones. */
		attrs?: FieldButtonAttributes;
	} = $props();

	// A mixed checkbox is not checked yet, so its next state is the opposite of the boolean it
	// holds: a mixed row that already holds `true` turns off instead of doing nothing.
	const toggle = () => {
		if (disabled) return;
		onCheckedChange(!checked);
	};

	// `control` is the compact, label-less checkbox: a string name is spoken rather than painted,
	// so the row keeps its accessible name without growing visible text.
	const hiddenLabel = $derived(mode === 'control' && typeof label === 'string' ? label : undefined);

	// The painted label names the row and the description describes it, so the description does
	// not become part of the accessible name. An `aria-label` from `inputAttrs` names the row
	// instead of the label; an `aria-labelledby` there wins over both.
	// Not `${id}-label` and `${id}-description`: those are Field's own ids, which Field manages.
	const labelId = $derived(`${id}-item-label`);
	const descriptionId = $derived(`${id}-item-description`);
	const labelledBy = $derived(
		attrs?.['aria-labelledby'] ??
			(label && !hiddenLabel && !attrs?.['aria-label'] ? labelId : undefined)
	);
	// Only spread when there is something to say. An `aria-describedby={undefined}` in the
	// template would make Svelte own the attribute and remove what Field wrote for the helper,
	// the description and the errors on the next attribute update (the first toggle).
	const describedBy = $derived(
		[attrs?.['aria-describedby'], description ? descriptionId : undefined]
			.filter(Boolean)
			.join(' ') || undefined
	);
	const describedByAttrs = $derived(describedBy ? { 'aria-describedby': describedBy } : {});
</script>

<button
	{...attrs}
	bind:this={ref}
	{id}
	type="button"
	role="checkbox"
	aria-label={hiddenLabel ?? attrs?.['aria-label']}
	aria-labelledby={labelledBy}
	{...describedByAttrs}
	aria-controls={controls}
	aria-checked={indeterminate ? 'mixed' : checked}
	aria-readonly={readOnly || undefined}
	{disabled}
	data-readonly={readOnly ? '' : undefined}
	data-state={indeterminate ? 'mixed' : checked ? 'checked' : 'unchecked'}
	onclick={(event) => {
		attrs?.onclick?.(event);
		if (!event.defaultPrevented) toggle();
	}}
	onfocus={(event) => {
		attrs?.onfocus?.(event);
		onFocus?.();
	}}
	onblur={(event) => {
		attrs?.onblur?.(event);
		onBlur?.();
	}}
	onkeydown={(event) => {
		attrs?.onkeydown?.(event);
		if (!event.defaultPrevented) onEnter?.(event);
	}}
	class={classes.checkboxesInputItem({ mode, checked, disabled, size, readOnly })}
>
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
		<Slot
			render={label}
			attrs={{ id: labelId }}
			class={classes.checkboxesInputItemLabel({ size })}
		/>
	{/if}
	<Slot
		render={description}
		attrs={{ id: descriptionId }}
		class={classes.checkboxesInputItemDescription({ mode, checked })}
	/>
</button>
