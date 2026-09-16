<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import type { ButtonInternalProps } from '$lib/components/Button/button.props.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import { useFieldTheme } from './field.theme.js';

	type FieldActionButtonEdge = 'start' | 'end' | 'none';
	type FieldActionButtonProps = WithAttachments<
		Pick<
			ButtonInternalProps,
			| 'controls'
			| 'expanded'
			| 'haspopup'
			| 'pressed'
			| 'class'
			| 'color'
			| 'disabled'
			| 'id'
			| 'onclick'
			| 'prefix'
			| 'size'
			| 'type'
		> & {
			/** Accessible label applied as aria-label on the action button. */
			label?: string;
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
		controls,
		expanded,
		haspopup,
		pressed,
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
	{haspopup}
	{expanded}
	{controls}
	{pressed}
	{disabled}
	class={classes.actionButton({ size, edge, active, class: className })}
	{prefix}
	{onclick}
	{...attachments}
/>
