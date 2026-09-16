<script lang="ts" generics="State">
	import Button from '$lib/components/Button/Button.svelte';
	import type { ButtonProps } from '$lib/components/Button/index.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import type { Slot as SlotValue } from '$lib/components/Slot/slot.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import { cx } from '$lib/utils/cva/index.js';
	import { useFieldTheme } from '../Field/field.theme.js';
	import type { FieldLabelPosition } from '../Field/field.js';
	import type { MaybePromise } from './form.js';

	type Action = ButtonProps & {
		onAction?: (payload: State) => MaybePromise<unknown>;
	};

	let {
		actions,
		form,
		size,
		density = 'normal',
		class: className,
		containerClass,
		label,
		description,
		labelPosition = 'top'
	}: {
		actions: Action[];
		form: State & { loading: boolean };
		size: Sizes;
		density?: Density;
		class: string;
		containerClass?: string;
		label?: SlotValue;
		description?: SlotValue;
		labelPosition?: FieldLabelPosition;
	} = $props();

	const fieldClasses = $derived(useFieldTheme());
	const resolvedLabelPosition = $derived(label || description ? labelPosition : 'top');
	const actionStates = $derived(
		actions.map(({ onAction, onclick, loading, disabled, size: actionSize, ...props }) => ({
			onAction,
			onclick,
			loading,
			disabled,
			size: actionSize,
			props
		}))
	);
</script>

{#snippet buttons()}
	{#each actionStates as actionState, index (index)}
		<Button
			{...actionState.props}
			size={actionState.size ?? size}
			loading={form.loading || actionState.loading}
			disabled={form.loading || actionState.disabled}
			onclick={(event) => {
				actionState.onclick?.(event);
				if (!event.defaultPrevented) return actionState.onAction?.(form);
			}}
		/>
	{/each}
{/snippet}

{#if label || description}
	<div
		data-label-position={resolvedLabelPosition}
		class={cx(
			fieldClasses.root({
				className: containerClass,
				density,
				hasError: false,
				labelPosition: resolvedLabelPosition
			}),
			// The action row rides the Field grid: in `left` mode that root is an inline-size
			// container, so the label/buttons split below is a container query on the row's own
			// width (`@lg` = 32rem) and the action label lines up with every other field label.
			resolvedLabelPosition === 'left' && 'min-w-0'
		)}
	>
		{#if label || description}
			<div
				class={cx(
					fieldClasses.header({
						density,
						required: false,
						hasError: false,
						labelPosition: resolvedLabelPosition
					}),
					'grid items-start gap-1',
					resolvedLabelPosition === 'left' && 'min-w-0'
				)}
			>
				{#if label}
					<Slot
						class={fieldClasses.label({ size, hasError: false, required: false })}
						render={label}
					/>
				{/if}
				{#if description}
					<Slot class={fieldClasses.description({ size })} render={description} />
				{/if}
			</div>
		{/if}
		<div
			class={cx(
				fieldClasses.inputContainer({
					density,
					hasError: false,
					labelPosition: resolvedLabelPosition
				}),
				resolvedLabelPosition === 'left' && 'min-w-0'
			)}
		>
			<div class={cx(className, resolvedLabelPosition === 'left' && '@lg:flex-nowrap')}>
				{@render buttons()}
			</div>
		</div>
	</div>
{:else}
	<div class={[containerClass, className].filter(Boolean).join(' ')}>{@render buttons()}</div>
{/if}
