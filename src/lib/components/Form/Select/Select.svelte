<script lang="ts" generics="Multiple extends boolean = false">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { createFieldState, type FieldValidatorResult } from '../Field/field.state.svelte.js';
	import type { FieldValue } from '../Field/field.js';
	import type { SelectOption, SelectProps, SelectValue } from './select.props.js';
	import { useSelectTheme } from './select.theme.js';
	import { SelectState } from './select.state.svelte.js';
	import SelectOptionRow from './SelectOptionRow.svelte';
	import Popover from '../../Popover/Popover.svelte';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import { caretDownIcon } from '../../Icons/caretDown.js';
	import { checkIcon } from '../../Icons/check.js';
	import { xIcon } from '../../Icons/x.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { presence } from '$lib/utils/stateAttributes.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		required = false,
		placeholder,
		i18n,
		theme,
		disabled,
		readOnly,
		messages,
		name,
		id: idProp,
		size = 'normal',
		density = 'normal',
		onValidate,
		onValueChange,
		visible,
		items,
		multiple = false as Multiple,
		formatValue,
		clearable = false,
		autocomplete,
		separators = true,
		alignItemWithTrigger = true,
		triggerAttrs,
		label,
		...rest
	}: SelectProps<Multiple> = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const generatedId = $props.id();
	const id = untrack(() => idProp) ?? generatedId;
	let valueEl = $state<HTMLElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);
	let viewportEl = $state<HTMLDivElement | null>(null);
	let contentEl = $state<HTMLDivElement | null>(null);
	const t = $derived(useI18n(i18n));
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	type Value = FieldValue<'select' | 'select-multiple'>;
	const field = createFieldState<'select' | 'select-multiple'>({
		id,
		get value() {
			return value as Value | null | undefined;
		},
		set value(v) {
			value = v as SelectValue<Multiple> | undefined;
		},
		get errors() {
			return errors;
		},
		set errors(v: string[] | boolean) {
			errors = v;
		},
		get focused() {
			return focused;
		},
		set focused(v: boolean) {
			focused = v;
		},
		get onValueChange() {
			return onValueChange as ((value: Value | null) => void) | undefined;
		},
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
		},
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		get onValidate() {
			return onValidate as ((value: Value) => FieldValidatorResult) | undefined;
		},
		get visible() {
			return visible;
		},
		// Fixed for the life of the field: a Select does not change what it holds.
		type: untrack(() => multiple) ? 'select-multiple' : 'select'
	});

	const select = new SelectState({
		id,
		get items() {
			return items;
		},
		get value() {
			return field.value;
		},
		set value(v) {
			field.value = v as Value | null;
		},
		get multiple() {
			return multiple;
		},
		get disabled() {
			return field.disabled;
		},
		get readOnly() {
			return field.readOnly;
		},
		get triggerEl() {
			return field.node;
		},
		set triggerEl(_) {
			// field.node is owned by the bind:this below.
		},
		get alignItemWithTrigger() {
			return alignItemWithTrigger;
		},
		get valueEl() {
			return valueEl;
		},
		get listEl() {
			return listEl;
		},
		get viewportEl() {
			return viewportEl;
		},
		get contentEl() {
			return contentEl;
		},
		openState: {
			get: () => openState.value,
			set: (next) => {
				openState.value = next;
			}
		},
		get onOpenChange() {
			return onOpenChange;
		}
	});

	const classes = $derived(useSelectTheme(theme));

	// What the trigger shows for the selection: the option's label, or `formatValue` of the
	// selected options (the default lists two labels and counts the rest).
	const defaultFormat = (options: SelectOption[]) =>
		options
			.slice(0, 2)
			.map((option) => option.label)
			.join(', ') + (options.length > 2 ? ` +${options.length - 2}` : '');
	const hasValue = $derived(select.selectedOptions.length > 0);
	const valueText = $derived(
		!hasValue
			? undefined
			: multiple
				? (formatValue ?? defaultFormat)(select.selectedOptions)
				: select.selectedOption?.label
	);

	// A `<label for>` elsewhere on the page names the trigger (see `id`): the placeholder fallback
	// below must not override it, and a click on it focuses the trigger without opening the list.
	// Only an unlabelled Select looks: `labels` scans the document.
	let externallyLabelled = $state(false);
	$effect(() => {
		const node = field.node as HTMLButtonElement | null;
		if (label || triggerAttrs?.['aria-labelledby'] || !node) {
			externallyLabelled = false;
			return;
		}
		const labels = Array.from(node.labels ?? []);
		externallyLabelled = labels.length > 0;
		const stops = labels.map((element) => on(element, 'click', () => select.noteLabelClick()));
		return () => stops.forEach((stop) => stop());
	});

	// What a browser autofill can name: the options that can be chosen.
	const autofillOptions = $derived(select.flatOptions.filter((option) => !option.disabled));
</script>

{#snippet checkMark()}
	{@render checkIcon({})}
{/snippet}

<Popover
	haspopup="listbox"
	closeOnClickOutside={false}
	closeOnEscape={false}
	fitTrigger
	position="bottom"
	ref={field.node?.parentElement}
	positionPanel={select.positionPanel}
	size="small"
	transition={{
		in: { scale: 1, opacity: 0 },
		out: { scale: 1, opacity: 0 }
	}}
	open={select.isOpen}
	onAfterOpen={() => onAfterOpen?.()}
	onAfterClose={() => onAfterClose?.()}
>
	<!-- Virtual focus: DOM focus stays on the combobox trigger; the listbox is a programmatic
	     target only (tabindex=-1), and focus that a screen reader moves into the panel keeps it
	     open. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={contentEl}
		class={classes.content({ size })}
		onmousedown={(event) => {
			// Keep DOM focus on the trigger for ANY press inside the panel (group labels,
			// separators, padding, scrollbar) — otherwise the trigger blurs and the dropdown
			// closes before the click lands.
			event.preventDefault();
		}}
		onfocusout={select.onPanelFocusOut}
		onkeydown={select.onPanelKeydown}
	>
		<!-- The scroll viewport is the listbox: it owns the scrolling and its options are the nodes
		     the accessibility tree lists under it (groups only for labelled sets). The trigger's
		     active-descendant navigation scrolls the highlighted option into view, so the viewport
		     takes no tab stop of its own. -->
		<ScrollArea
			bind:ref={listEl}
			bind:viewportRef={viewportEl}
			viewportAttrs={{
				id: select.listboxId,
				role: 'listbox',
				'aria-label': t.options,
				'aria-multiselectable': multiple ? true : undefined,
				tabindex: -1,
				class: classes.listbox()
			}}
			scrollOnEdges
			type="auto"
			class={classes.list({ dropdown: select.dropdown })}
		>
			{#each select.renderGroups as group, groupIndex (groupIndex)}
				{#if separators && groupIndex > 0}
					<!-- Decorative divider between groups: the groups already convey the structure. -->
					<div role="presentation" class={classes.separator({ size })}></div>
				{/if}
				<!-- Only a labelled set is a group; bare options sit directly under the listbox. -->
				<div
					role={group.label ? 'group' : undefined}
					aria-label={group.label}
					class={classes.group({ size })}
				>
					{#if group.label}
						<div aria-hidden="true" class={classes.groupLabel({ size })}>{group.label}</div>
					{/if}
					{#each group.items as option (option.value)}
						<SelectOptionRow
							id={select.optionId(option.value)}
							label={option.label}
							{size}
							{density}
							highlighted={select.nav.highlighted === option.value}
							selected={select.isSelected(option.value)}
							disabled={!!option.disabled}
							check={checkMark}
							onactivate={(event) => select.activate(option.value, event)}
							onhover={(event) => {
								if (!option.disabled) select.nav.pointerHighlight(option.value, event);
							}}
						/>
					{/each}
				</div>
			{/each}
		</ScrollArea>
		<!-- For touch screen-reader users, who have no Escape key and reach the panel by swiping. -->
		<button type="button" tabindex="-1" class="sr-only" onclick={select.onCloseButton}>
			{t.close}
		</button>
	</div>
	{#snippet trigger()}
		<Field
			{field}
			{label}
			{size}
			{density}
			labelFor={false}
			theme={{
				...(theme || {}),
				inputContainer: {
					...(theme?.inputContainer || {}),
					base: classes.inputContainer({
						class: theme?.inputContainer?.base,
						size,
						disabled: field.disabled
					})
				}
			}}
			{...rest}
		>
			<button
				{...triggerAttrs}
				type="button"
				{id}
				bind:this={field.node}
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={select.isOpen}
				aria-controls={select.isOpen ? select.listboxId : undefined}
				aria-activedescendant={select.isOpen ? select.nav.activeDescendant : undefined}
				aria-required={required || undefined}
				aria-label={triggerAttrs?.['aria-label'] ??
					(label || triggerAttrs?.['aria-labelledby'] || externallyLabelled
						? undefined
						: (placeholder ?? t.selectOption))}
				data-placeholder={hasValue ? undefined : ''}
				data-readonly={presence(field.readOnly)}
				data-disabled={presence(field.disabled)}
				data-popup-open={presence(select.isOpen)}
				disabled={field.disabled}
				class={classes.input({ size, disabled: field.disabled })}
				onpointerdown={(event) => {
					triggerAttrs?.onpointerdown?.(event);
					select.onTriggerPointerDown(event);
				}}
				onclick={(event) => {
					triggerAttrs?.onclick?.(event);
					if (event.defaultPrevented) return;
					if (select.consumeLabelClick()) field.node?.focus();
					else select.toggle({ reason: 'trigger-press', event });
				}}
				onkeydown={(event) => {
					triggerAttrs?.onkeydown?.(event);
					if (!event.defaultPrevented) select.onTriggerKeydown(event);
				}}
				onfocus={(event) => {
					field.focused = true;
					triggerAttrs?.onfocus?.(event);
				}}
				onblur={(event) => {
					field.focused = false;
					select.onTriggerBlur(event);
					triggerAttrs?.onblur?.(event);
				}}
			>
				<span bind:this={valueEl} class={classes.value({ size, placeholder: !hasValue })}>
					{valueText ?? placeholder ?? t.selectOption}
				</span>
				{@render caretDownIcon({ class: classes.triggerIcon({ size }) })}
			</button>
			{#if name || required || (autocomplete && !multiple)}
				<!-- Beside the trigger, not in it: what a native form submits (one input per value), what a
				     browser autofills, and the stand-in that blocks a native submit while a required Select
				     is empty. -->
				<FieldHiddenInputs
					{field}
					value={field.value}
					autocomplete={multiple ? undefined : autocomplete}
					options={autofillOptions}
				/>
			{/if}
			{#if clearable && hasValue && !field.readOnly && !field.disabled}
				<FieldActionButton
					{size}
					color="danger"
					class="relative"
					label={`${t.clear} ${t.selection}`}
					prefix={xIcon}
					onclick={() => {
						select.clear();
						field.node?.focus();
					}}
				/>
			{/if}
		</Field>
	{/snippet}
</Popover>
