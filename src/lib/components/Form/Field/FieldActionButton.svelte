<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import type { ButtonPrimitiveProps } from '$lib/components/Button/button.props.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import { useFieldTheme } from './field.theme.js';

	type FieldActionButtonEdge = 'start' | 'end' | 'none';
	type FieldActionButtonProps = WithAttachments<
		Pick<
			ButtonPrimitiveProps,
			| 'aria-controls'
			| 'aria-expanded'
			| 'aria-haspopup'
			| 'aria-pressed'
			| 'class'
			| 'color'
			| 'disabled'
			| 'id'
			| 'label'
			| 'onclick'
			| 'prefix'
			| 'size'
			| 'type'
		> & {
			/** Marks the adjacent field action as active. */
			active?: boolean;
			/** Field edge whose padding the action occupies. */
			edge?: FieldActionButtonEdge;
		}
	>;

	let {
		active = false,
		id,
		class: className,
		color,
		disabled,
		edge = 'end',
		label,
		onclick,
		prefix,
		size,
		type = 'button',
		'aria-controls': ariaControls,
		'aria-expanded': ariaExpanded,
		'aria-haspopup': ariaHaspopup,
		'aria-pressed': ariaPressed,
		...attachments
	}: FieldActionButtonProps = $props();

	const classes = $derived(useFieldTheme());
	const effectiveColor = $derived(color ?? (active ? 'primary' : 'neutral'));
</script>

<Button
	{id}
	{type}
	variant="ghost"
	color={effectiveColor}
	{size}
	squared={true}
	{label}
	aria-haspopup={ariaHaspopup}
	aria-expanded={ariaExpanded}
	aria-controls={ariaControls}
	aria-pressed={ariaPressed}
	{disabled}
	class={classes.actionButton({ size, edge, active, class: className })}
	{prefix}
	{onclick}
	{...attachments}
/>
