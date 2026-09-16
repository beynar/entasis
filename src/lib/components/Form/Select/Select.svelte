<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { SelectProps } from './select.props.js';
	import { useSelectTheme } from './select.theme.js';
	import { SelectState } from './select.state.svelte.js';
	import Popover from '../../Popover/Popover.svelte';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import MenuOption from '../../MenuOption/MenuOption.svelte';
	import { caretDownIcon } from '../../Icons/caretDown.js';
	import { checkIcon } from '../../Icons/check.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		placeholder,
		i18n,
		theme,
		disabled,
		name,
		size = 'normal',
		density = 'normal',
		onValidate,
		onValueChange,
		visible,
		items,
		separators = true,
		triggerAttrs,
		label,
		...rest
	}: SelectProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n(i18n));

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v;
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
			return onValueChange;
		},
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
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
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'select'
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
			field.value = v;
		},
		get disabled() {
			return field.disabled;
		},
		get triggerEl() {
			return field.node;
		},
		set triggerEl(_) {
			// field.node is owned by the bind:this below.
		}
	});

	const classes = $derived(useSelectTheme(theme));
</script>

{#snippet checkMark()}
	{@render checkIcon({})}
{/snippet}

<Popover
	closeOnClickOutside={false}
	closeOnEscape={false}
	fitTrigger
	position="bottom"
	ref={field.node?.parentElement}
	size="small"
	transition={{
		in: { scale: 1, opacity: 0 },
		out: { scale: 1, opacity: 0 }
	}}
	open={select.isOpen}
>
	<!-- Virtual focus: DOM focus stays on the combobox trigger; tabindex=-1 keeps the
	     listbox out of the tab order while remaining a valid programmatic target. -->
	<div
		id={select.listboxId}
		role="listbox"
		aria-label={t.options}
		tabindex={-1}
		class={classes.content({ size })}
		onmousedown={(event) => {
			// Keep DOM focus on the trigger for ANY press inside the panel (group labels,
			// separators, padding, scrollbar) — otherwise the trigger blurs and the dropdown
			// closes before the click lands.
			event.preventDefault();
		}}
	>
		<ScrollArea scrollOnEdges type="auto" class="flex max-h-[240px] flex-col">
			{#each select.renderGroups as group, groupIndex (groupIndex)}
				{#if separators && groupIndex > 0}
					<div role="separator" class={classes.separator({ size })}></div>
				{/if}
				<div role="group" aria-label={group.label} class={classes.group({ size })}>
					{#if group.label}
						<div aria-hidden="true" class={classes.groupLabel({ size })}>{group.label}</div>
					{/if}
					{#each group.items as option (option.value)}
						<MenuOption
							as="button"
							role="option"
							{size}
							{density}
							title={option.label}
							highlighted={select.nav.highlighted === option.value}
							selected={field.value === option.value}
							disabled={!!option.disabled}
							suffix={field.value === option.value ? checkMark : undefined}
							onclick={() => select.selectValue(option.value)}
							attrs={{
								id: select.optionId(option.value),
								tabindex: -1,
								onpointermove: () => {
									if (!option.disabled) select.nav.setHighlighted(option.value);
								}
							}}
						/>
					{/each}
				</div>
			{/each}
		</ScrollArea>
	</div>
	{#snippet trigger()}
		<Field
			{field}
			{label}
			{size}
			{density}
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
					(label ? undefined : (placeholder ?? t.selectOption))}
				data-placeholder={select.selectedOption ? undefined : ''}
				disabled={field.disabled}
				class={classes.input({ size, disabled: field.disabled })}
				onclick={(event) => {
					triggerAttrs?.onclick?.(event);
					if (!event.defaultPrevented) select.toggle();
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
					select.close();
					triggerAttrs?.onblur?.(event);
				}}
			>
				<span class={classes.value({ size, placeholder: !select.selectedOption })}>
					{select.selectedOption?.label ?? placeholder ?? t.selectOption}
				</span>
				{@render caretDownIcon({ class: classes.triggerIcon({ size }) })}
			</button>
		</Field>
	{/snippet}
</Popover>

{#if name}
	<input type="hidden" {name} value={field.value ?? ''} />
{/if}
