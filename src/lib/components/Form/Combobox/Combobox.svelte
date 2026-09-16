<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { ComboboxProps, ComboboxOption } from './combobox.props.js';
	import Popover from '../../Popover/Popover.svelte';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import MenuOption from '../../MenuOption/MenuOption.svelte';
	import { xIcon } from '../../Icons/x.js';
	import { magnifyingGlassIcon } from '../../Icons/magnifyingGlass.js';
	import { useDebounce } from '$lib/utils/useDebounce.svelte.js';
	import type { PopoverState } from '../../Popover/popover.state.svelte.js';
	import { useComboboxTheme } from './combobox.theme.js';
	import { useKeyDown } from '$lib/utils/useKeyDown.svelte.js';
	import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
	import { onMount, untrack } from 'svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';

	let {
		defaultValue = null,
		value = $bindable(),
		searchValue = $bindable(''),
		errors = $bindable([]),
		loading = $bindable(false),
		focused = $bindable(false),
		required = false,
		size = 'normal',
		density = 'normal',
		placeholder = '',
		items,
		showAllOnFocus = false,
		getValueOption,
		loadingText,
		noOptionsText,
		i18n,
		theme,
		disabled,
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
	const listboxId = `${id}-listbox`;
	const optionId = (value: string) => `${id}-option-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
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

	const selectedOption = $derived(
		typeof items === 'function'
			? currentOption
			: (items.find((option) => option.value === field.value) ?? null)
	);

	// Load options state

	// Keyboard navigation state

	const getOptions = async (searchValue?: string | null, showAllOnFocus?: boolean) => {
		const isOptionsAsync = typeof items === 'function';
		if (!searchValue) {
			if (!showAllOnFocus || isOptionsAsync) {
				return { options: [] as ComboboxOption[], error: null };
			} else {
				return { options: items, error: null };
			}
		} else {
			if (isOptionsAsync) {
				loading = true;
				try {
					const results = await items(searchValue);
					return { options: results, error: null };
				} catch (error) {
					return {
						options: [] as ComboboxOption[],
						error: error instanceof Error ? error.message : t.failedToLoadOptions
					};
				} finally {
					loading = false;
				}
			} else {
				const result = items.filter((option) =>
					option.label.toLowerCase().includes(searchValue.toLowerCase())
				);

				return { options: result, error: null };
			}
		}
	};
	let optionsAsync = $state<{ options: ComboboxOption[]; error: string | null }>({
		options: [],
		error: null
	});

	const debouncedSearch = useDebounce((searchValue?: string | null, showAllOnFocus?: boolean) => {
		getOptions(searchValue, showAllOnFocus).then((result) => {
			optionsAsync = result;
		});
	}, 100);

	$effect(() => {
		void searchValue;
		void showAllOnFocus;
		untrack(() => {
			debouncedSearch(searchValue, showAllOnFocus);
		});
	});

	const isOpen = $derived.by(() => {
		// Should show if
		// has error or  has options or has no options and a search value
		// is focused
		return !!(
			field.focused &&
			(optionsAsync.error ||
				optionsAsync.options.length > 0 ||
				(optionsAsync.options.length === 0 && searchValue))
		);
	});

	// Handle option selection
	const handleSelectOption = (option: ComboboxOption) => {
		currentOption = option;
		field.value = option.value;
		searchValue = '';
		field.node?.blur();
	};

	// Handle clear
	const handleClear = () => {
		currentOption = null;
		field.value = null;
		searchValue = '';
		field.node?.blur();
	};

	// Keyboard navigation: value-driven virtual focus. Re-anchors the highlight to the first
	// option whenever the (async) option set changes.
	const nav = useListNavigation({
		values: () => optionsAsync.options.map((option) => option.value),
		optionId,
		onSelect: (value) => {
			const option = optionsAsync.options.find((opt) => opt.value === value);
			if (option) handleSelectOption(option);
		}
	});

	useKeyDown({
		isActive: () => field.focused,
		keys: ['Escape'],
		callback: () => {
			field.node?.blur();
		},
		onWindow: () => true
	});
	const keyDownHook = useKeyDown({
		isActive: () => isOpen || field.focused,
		keys: ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Home', 'End'],
		callback: (event: KeyboardEvent) => {
			if (!isOpen || optionsAsync.options.length === 0) {
				if (event.key === 'ArrowDown' || event.key === 'Enter') {
					if (searchValue) {
						field.focused = true;
					}
				}
				return;
			}

			if (event.key === 'Escape') {
				field.focused = false;
				return;
			}
			nav.onKeydown(event);
		},
		onWindow: () => false // Only attach to input element, not window
	});

	onMount(async () => {
		if (field.value) {
			if (typeof items === 'function') {
				currentOption = (await getValueOption?.(field.value)) || null;
			}
		}
	});

	// Determine if we should show clear button
	const showClear = $derived(searchValue || field.value);

	// Default prefix: magnifying glass icon (unless prefix is false or custom snippet provided)
	const effectivePrefix = $derived(
		prefix === false ? undefined : (prefix ?? magnifyingGlassIcon.withProps({ size: 20 }))
	);

	const classes = $derived(useComboboxTheme(theme));
</script>

<Popover closeOnClickOutside={false} fitTrigger position="bottom" size="small" open={isOpen}>
	<div
		id={listboxId}
		role="listbox"
		aria-label={t.options}
		class="flex max-h-[200px] flex-col gap-1"
	>
		{#if loading}
			<div class={classes.loading({ size })} role="status" aria-live="polite">
				{loadingText ?? t.loadingEllipsis}
			</div>
		{:else if optionsAsync.error}
			<div class={classes.error({ size })} role="alert" aria-live="assertive">
				{optionsAsync.error}
			</div>
		{:else if optionsAsync.options.length === 0 && searchValue}
			<div class={classes.noOptions({ size })} role="status">{noOptionsText ?? t.noOptions}</div>
		{:else if optionsAsync.options.length === 0 && !searchValue && showAllOnFocus}
			<div class={classes.noOptions({ size })} role="status">{noOptionsText ?? t.noOptions}</div>
		{:else if optionsAsync.options.length > 0}
			<ScrollArea scrollOnEdges type="auto" class="flex max-h-[200px] flex-col gap-1">
				{#each optionsAsync.options as option (option.value)}
					<MenuOption
						as="button"
						role="option"
						{size}
						{density}
						title={option.label}
						description={option.description}
						highlighted={nav.highlighted === option.value}
						selected={field.value === option.value}
						onclick={() => handleSelectOption(option)}
						attrs={{
							id: optionId(option.value),
							onpointermove: () => nav.setHighlighted(option.value),
							onmousedown: (e: MouseEvent) => {
								e.stopPropagation();
								e.preventDefault();
							}
						}}
					/>
				{/each}
			</ScrollArea>
		{/if}
	</div>
	{#snippet trigger(popover: PopoverState)}
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
				name={field.name}
				bind:value={searchValue}
				placeholder={selectedOption ? selectedOption.label : placeholder}
				bind:this={field.node}
				bind:focused={field.focused}
				{disabled}
				role="combobox"
				aria-expanded={isOpen}
				aria-controls={isOpen ? listboxId : undefined}
				aria-autocomplete="list"
				aria-activedescendant={isOpen ? nav.activeDescendant : undefined}
				aria-haspopup="listbox"
				aria-invalid={!!optionsAsync.error}
				autocomplete="off"
				class={classes.input({ size, hasValue: field.value !== null, disabled: field.disabled })}
				class:placeholder:text-neutral={selectedOption && !searchValue}
				{@attach keyDownHook.reference}
			/>
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
