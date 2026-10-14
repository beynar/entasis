<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { ComboboxProps, ComboboxOption } from './combobox.props.js';
	import Popover from '../../Popover/Popover.svelte';
	import { xIcon } from '../../Icons/x.js';
	import { magnifyingGlassIcon } from '../../Icons/magnifyingGlass.js';
	import type { PopoverApi } from '../../Popover/popover.api.js';
	import { useComboboxTheme } from './combobox.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { flattenItems } from './combobox.items.js';
	import { ComboboxController } from './combobox.state.svelte.js';
	import ComboboxPopup from './ComboboxPopup.svelte';
	import { untrack } from 'svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';

	let {
		defaultValue = null,
		value = $bindable(),
		searchValue = $bindable(''),
		errors = $bindable([]),
		loading = $bindable(false),
		focused = $bindable(false),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		required = false,
		size = 'normal',
		density = 'normal',
		placeholder = '',
		items,
		openOnFocus,
		showAllOnFocus = false,
		filter,
		limit,
		autoHighlight = 'always',
		loop,
		onHighlightChange,
		separators = true,
		item,
		getValueOption,
		loadingText,
		noOptionsText,
		i18n,
		theme,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		visible,
		prefix,
		suffix,
		description,
		...rest
	}: ComboboxProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n(i18n));
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	// Options resolved from an async source, for the label of the selected value.
	let currentOption = $state<ComboboxOption | null>(null);

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
		onValueChange: (v) => {
			onValueChange?.({ value: v, option: selectedOption });
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
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'combobox'
	});

	const controller = new ComboboxController({
		id,
		field,
		items: () => items,
		filter: () => filter,
		limit: () => limit,
		messages: () => t,
		loadingText: () => loadingText,
		noOptionsText: () => noOptionsText,
		query: {
			get: () => searchValue,
			set: (next) => {
				searchValue = next;
			}
		},
		loading: {
			get: () => loading,
			set: (next) => {
				loading = next;
			}
		},
		open: {
			get: () => openState.value,
			set: (next) => {
				openState.value = next;
			}
		},
		onOpenChange: () => onOpenChange,
		openOnFocus: () => openOnFocus ?? showAllOnFocus,
		autoHighlight: () => autoHighlight,
		loop: () => loop,
		anchor: () => field.value ?? undefined,
		onHighlightChange: () => onHighlightChange,
		onSelect: (option, event) => {
			currentOption = option;
			field.setValue(option.value);
			controller.close({ reason: 'item-press', event });
			searchValue = '';
		}
	});

	// A static list knows its options; an async source reports the selected one through
	// `getValueOption`, or from the results it has loaded.
	const selectedOption = $derived(
		typeof items === 'function'
			? currentOption
			: (flattenItems(items).find((option) => option.value === field.value) ?? null)
	);

	// The label follows the value, also when the parent changes it from outside.
	let resolution = 0;
	$effect(() => {
		const current = field.value;
		if (typeof items !== 'function') return;
		untrack(() => {
			if (current == null) {
				currentOption = null;
				return;
			}
			if (currentOption?.value === current) return;
			const loaded = controller.fetchedOptions.find((option) => option.value === current);
			if (loaded) {
				currentOption = loaded;
				return;
			}
			const request = ++resolution;
			currentOption = null;
			void Promise.resolve(getValueOption?.(current)).then((option) => {
				if (request === resolution && field.value === current) currentOption = option ?? null;
			});
		});
	});

	const handleClear = () => {
		currentOption = null;
		field.setValue(null);
		searchValue = '';
		field.node?.focus();
	};

	// Determine if we should show clear button
	const showClear = $derived((searchValue || field.value) && !field.readOnly && !field.disabled);

	// Default prefix: magnifying glass icon (unless prefix is false or custom snippet provided)
	const effectivePrefix = $derived(
		prefix === false ? undefined : (prefix ?? magnifyingGlassIcon.withProps({ size: 20 }))
	);

	const classes = $derived(useComboboxTheme(theme));
</script>

<Popover
	haspopup="listbox"
	closeOnClickOutside={false}
	closeOnEscape={false}
	focusOnClose={false}
	fitTrigger
	position="bottom"
	size="small"
	open={controller.visible}
	onAfterOpen={() => onAfterOpen?.()}
	onAfterClose={() => onAfterClose?.()}
>
	<ComboboxPopup
		{controller}
		{classes}
		{size}
		{density}
		{separators}
		{item}
		{i18n}
		isSelected={(option) => field.value === option.value}
	/>
	{#snippet trigger(popover: PopoverApi)}
		<Field
			{density}
			{field}
			{size}
			{description}
			prefix={effectivePrefix}
			{suffix}
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
			{@attach popover.reference}
		>
			<input
				data-1p-ignore
				type="text"
				{id}
				bind:value={searchValue}
				placeholder={selectedOption ? selectedOption.label : placeholder}
				bind:this={field.node}
				bind:focused={field.focused}
				disabled={field.disabled}
				role="combobox"
				aria-expanded={controller.expanded}
				aria-controls={controller.expanded ? controller.listboxId : undefined}
				aria-autocomplete="list"
				aria-activedescendant={controller.activeDescendant}
				aria-haspopup="listbox"
				aria-invalid={controller.error !== null}
				autocomplete="off"
				class={classes.input({ size, hasValue: field.value !== null, disabled: field.disabled })}
				class:placeholder:text-neutral={selectedOption && !searchValue}
				oninput={(event) => controller.onInput(event)}
				onkeydown={(event) => controller.onKeydown(event)}
				onfocus={(event) => controller.onFocus(event)}
				onpointerdown={() => controller.onPointerDown()}
				onclick={(event) => controller.onClick(event)}
			/>
			<!-- The search box holds a draft, not the value: the value is what a native form submits. -->
			<FieldHiddenInputs {field} value={field.value} />
			<!-- Persistent, so it exists before the first announcement: result counts and status. -->
			<span class="sr-only" {...controller.announcer.regionAttrs}>
				{controller.announcer.message}
			</span>
			{#if showClear && !suffix}
				<FieldActionButton
					{size}
					color="danger"
					label={`${t.clear} ${t.selection}`}
					disabled={field.disabled}
					prefix={xIcon}
					onclick={handleClear}
				/>
			{/if}
		</Field>
	{/snippet}
</Popover>
