<script lang="ts" generics="I extends FormInputs">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { getContext } from 'svelte';
	import { useCardTheme } from '$lib/components/Card/card.theme.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { cx } from '$lib/utils/cva/index.js';
	import type { FormInputs, FormInput, FormRenderableInput } from './form.js';
	import FormActions from './FormActions.svelte';
	import FormFieldRenderer from './FormFieldRenderer.svelte';
	import FormInputRenderer from './FormInputRenderer.svelte';
	import type { FormProps } from './form.props.js';
	import { useFormTheme } from './form.theme.js';
	import { useForm } from './form.state.svelte.js';
	import { formCardSurfaceContextKey, type FormCardSurfaceContext } from './form.context.js';
	let {
		inputs,
		onSubmit,
		defaultValue = {},
		value = $bindable(),
		onValueChange,
		class: className,
		header,
		title,
		description,
		children,
		footer,
		form = $bindable(),
		size = 'normal',
		density = 'normal',
		variant = 'plain',
		layout = 'vertical',
		actions,
		theme
	}: FormProps<I> = $props();
	const valueState = createBindableValue(
		() => value,
		(nextValue) => {
			value = nextValue;
		},
		() => defaultValue
	);

	const formState = useForm({
		get inputs() {
			return inputs;
		},
		get onSubmit() {
			return onSubmit;
		},
		get value() {
			return valueState.value;
		},
		set value(v) {
			valueState.value = v;
		},
		get onValueChange() {
			return onValueChange;
		}
	});
	if (form !== formState) form = formState;
	const inputsEntries = $derived(Object.entries<FormInput>(inputs));
	const visibleInputsEntries = $derived(
		inputsEntries.filter(([, input]) =>
			input.type === 'group' ? formState.isGroupVisible(input) : formState.isFieldVisible(input)
		)
	);
	const labelPosition = $derived(layout === 'horizontal' ? 'left' : undefined);
	const hasSectionBorders = $derived(variant !== 'plain');
	const cardSurfaceContext = getContext<FormCardSurfaceContext>(formCardSurfaceContextKey);
	const hasCardSurface = $derived(variant === 'card' && !cardSurfaceContext?.isOwned);
	const cardTextVariant = $derived(hasCardSurface ? 'solid' : 'ghost');

	const classes = $derived(useFormTheme(theme));
	const cardClasses = $derived(useCardTheme());
</script>

{#snippet headerSnippet()}
	<Slot
		render={title}
		payload={form}
		class={cx(
			cardClasses.title({ size, variant: cardTextVariant }),
			classes.formTitle({ size, variant })
		)}
	/>
	<Slot
		render={description}
		payload={formState}
		class={cx(
			cardClasses.description({ size, variant: cardTextVariant }),
			classes.formDescription({ size, variant })
		)}
	/>
{/snippet}
{#snippet inputSnippet(name: string, input: FormRenderableInput, itemClass?: string)}
	{#if input.type === 'action'}
		<FormActions
			actions={input.actions}
			form={formState}
			{size}
			{density}
			label={input.label}
			description={input.description}
			labelPosition={input.labelPosition ?? labelPosition}
			class={classes.formActions({
				density,
				alignment: (input.labelPosition ?? labelPosition) === 'left' ? 'end' : 'start'
			})}
			containerClass={classes.formAction({
				className: [input.class, itemClass].filter(Boolean).join(' ')
			})}
		/>
	{:else if input.type === 'custom'}
		<Slot
			render={input.snippet}
			payload={formState}
			class={classes.formCustom({
				className: [input.class, itemClass].filter(Boolean).join(' ')
			})}
		/>
	{:else if input.type === 'field'}
		<FormFieldRenderer {name} {input} {size} {density} {labelPosition} {itemClass} />
	{:else}
		<FormInputRenderer {name} {input} {size} {density} {labelPosition} {itemClass} />
	{/if}
{/snippet}
<div
	role="form"
	{@attach formState.keyboardNavigation}
	data-size={size}
	data-density={density}
	data-variant={variant}
	data-color={hasCardSurface ? 'neutral' : undefined}
	data-layout={layout}
	class={cx(
		hasCardSurface
			? cardClasses.root({
					color: 'neutral',
					variant: 'solid',
					size,
					density,
					clickable: false,
					disabled: false
				})
			: undefined,
		classes.root({ density, variant, layout, className })
	)}
>
	<Slot
		render={header ? header : title || description ? headerSnippet : undefined}
		payload={formState}
		class={cx(
			cardClasses.header({
				density,
				hasAction: false,
				hasBorder: hasSectionBorders,
				variant: cardTextVariant
			}),
			classes.formHeader({ density, variant })
		)}
	/>
	{#each visibleInputsEntries as [name, input], index (name)}
		{@const itemClass =
			variant !== 'plain' && index > 0 ? classes.formItem({ density, variant }) : undefined}
		{#if input.type === 'group'}
			<fieldset
				class={classes.formGroup({
					density,
					className: [input.class, itemClass].filter(Boolean).join(' ')
				})}
			>
				<Slot as="legend" render={input.label} class={classes.formGroupLabel({ size })} />
				<Slot as="p" render={input.description} class={classes.formGroupDescription({ size })} />
				<div
					class={classes.formGroupFields({
						density,
						layout,
						columns: layout === 'horizontal' ? 1 : (input.columns ?? 2)
					})}
				>
					{#each Object.entries<FormRenderableInput>(input.inputs) as [childName, childInput] (childName)}
						{#if formState.isFieldVisible(childInput, input)}
							{@render inputSnippet(childName, childInput)}
						{/if}
					{/each}
				</div>
			</fieldset>
		{:else}
			{@render inputSnippet(name, input, itemClass)}
		{/if}
	{/each}
	{@render children?.(formState)}
	{#if footer || actions?.length}
		<div
			class={cx(
				cardClasses.footer({ density, hasBorder: hasSectionBorders }),
				classes.formFooter({ density, variant })
			)}
		>
			<Slot render={footer} payload={formState} />
			{#if actions?.length}
				<FormActions
					{actions}
					form={formState}
					{size}
					{density}
					class={classes.formActions({ density })}
				/>
			{/if}
		</div>
	{/if}
</div>
