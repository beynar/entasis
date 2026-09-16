<script lang="ts" generics="Type extends InputType">
	import Slot from '$lib/components/Slot/Slot.svelte';
	import type { InputType, FieldProps } from './field.js';
	import { useFieldTheme } from './field.theme.js';

	let {
		class: className = '',
		children,
		errorsContainer,
		description,
		helper,
		actions,
		error,
		suffix,
		label,
		prefix,
		footer,
		header,
		size = 'normal',
		density = 'normal',
		labelPosition = 'top',
		theme,
		field,
		as = 'div',
		labelFor = field.id,
		fieldAttrs,
		...attachments
	}: FieldProps<Type> = $props();

	const classes = $derived(useFieldTheme(theme));
	const resolvedLabelPosition = $derived(
		label || actions || header ? labelPosition : ('top' as const)
	);

	$effect(() => {
		const control = field.node ?? field.rootNode;
		if (!control) return;

		const initialInvalid = control.getAttribute('aria-invalid');
		const initialDescribedBy = control.getAttribute('aria-describedby');
		const initialLabelledBy = control.getAttribute('aria-labelledby');
		const currentDescribedByIds =
			control.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
		let describedByIds = currentDescribedByIds.filter((id) => id !== field.errorId);
		if (field.hasError) {
			control.setAttribute('aria-invalid', 'true');
			describedByIds = [...describedByIds, field.errorId];
		}

		if (describedByIds.length === 0) control.removeAttribute('aria-describedby');
		else control.setAttribute('aria-describedby', describedByIds.join(' '));

		const currentLabelledByIds =
			control.getAttribute('aria-labelledby')?.split(/\s+/).filter(Boolean) ?? [];
		// A control that declared its own labelledby (Switch's inline label) keeps it; only the
		// id this effect adds is subject to removal.
		const ownedByControl = initialLabelledBy?.split(/\s+/).includes(field.labelId) ?? false;
		let labelledByIds = currentLabelledByIds.filter((id) => id !== field.labelId || ownedByControl);
		if (label && labelFor === false && as !== 'fieldset') {
			labelledByIds = [...labelledByIds, field.labelId];
		}

		if (labelledByIds.length === 0) control.removeAttribute('aria-labelledby');
		else control.setAttribute('aria-labelledby', labelledByIds.join(' '));

		return () => {
			if (initialInvalid === null) control.removeAttribute('aria-invalid');
			else control.setAttribute('aria-invalid', initialInvalid);
			if (initialDescribedBy === null) control.removeAttribute('aria-describedby');
			else control.setAttribute('aria-describedby', initialDescribedBy);
			if (initialLabelledBy === null) control.removeAttribute('aria-labelledby');
			else control.setAttribute('aria-labelledby', initialLabelledBy);
		};
	});
</script>

<!-- Suffixed id: the bare field.id belongs to the control element, so <label for={field.id}>
     resolves to it — a duplicate id here (first in tree order) would steal the label linkage. -->
<svelte:element
	this={as}
	data-label-position={resolvedLabelPosition}
	class={classes.root({
		className,
		density,
		hasError: field.hasError,
		labelPosition: resolvedLabelPosition
	})}
	bind:this={field.rootNode}
	{...fieldAttrs}
	id="{field.id}-field"
	{...attachments}
>
	{#if label || actions || header}
		{#if as === 'fieldset'}
			<Slot
				as="legend"
				render={header}
				attrs={{ id: field.labelId }}
				class={classes.header({
					density,
					required: field.required,
					hasError: field.hasError,
					labelPosition: resolvedLabelPosition
				})}
			>
				<Slot
					as="span"
					class={classes.label({ size, hasError: field.hasError, required: field.required })}
					render={label}
				/>
				<Slot class={classes.actions({ density })} render={actions} />
			</Slot>
		{:else}
			<Slot
				render={header}
				class={classes.header({
					density,
					required: field.required,
					hasError: field.hasError,
					labelPosition: resolvedLabelPosition
				})}
			>
				<Slot
					as={labelFor === false ? 'span' : 'label'}
					attrs={labelFor === false ? { id: field.labelId } : { id: field.labelId, for: labelFor }}
					class={classes.label({ size, hasError: field.hasError, required: field.required })}
					render={label}
				/>
				<Slot class={classes.actions({ density })} render={actions} />
			</Slot>
		{/if}
	{/if}
	<div
		class={classes.inputContainer({
			density,
			hasError: field.hasError,
			labelPosition: resolvedLabelPosition
		})}
	>
		<Slot render={prefix} class={classes.prefix({ density })} />
		{@render children()}
		<Slot render={suffix} class={classes.suffix({ density })} />
	</div>
	{#if description || helper || footer}
		<Slot render={footer} class={classes.footer({ density, labelPosition: resolvedLabelPosition })}>
			<Slot class={classes.description({ size })} render={description} />
			<Slot class={classes.helper({ size })} render={helper} />
		</Slot>
	{/if}
	{#if field.hasError}
		<Slot
			render={errorsContainer}
			class={classes.errorsContainer({ size, labelPosition: resolvedLabelPosition })}
			attrs={{ id: field.errorId, role: 'alert', 'aria-live': 'polite' }}
		>
			{#each field.errorMessages as err, index (index)}
				<Slot render={error} class={classes.error({ size })}>
					{err}
				</Slot>
			{/each}
		</Slot>
	{/if}
</svelte:element>
