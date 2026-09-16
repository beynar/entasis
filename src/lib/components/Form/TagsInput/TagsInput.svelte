<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TagsInputProps } from './tagsInput.props.js';
	import type { ComboboxOption } from '../Combobox/combobox.props.js';
	import Chip from '../../Chip/Chip.svelte';
	import Popover from '../../Popover/Popover.svelte';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import MenuOption from '../../MenuOption/MenuOption.svelte';
	import { xIcon } from '../../Icons/x.js';
	import { useDebounce } from '$lib/utils/useDebounce.svelte.js';
	import type { PopoverState } from '../../Popover/popover.state.svelte.js';
	import { useTagsInputTheme } from './tagsInput.theme.js';
	import { useKeyDown } from '$lib/utils/useKeyDown.svelte.js';
	import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
	import { onMount, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import { SvelteMap } from 'svelte/reactivity';

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
		customTags = false,
		maxTags,
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
	}: TagsInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n(i18n));
	const listboxId = `${id}-listbox`;
	const optionId = (value: string) => `${id}-option-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

	// Session cache of options resolved from the dropdown or getValueOption, used for label lookup.
	const optionCache = new SvelteMap<string, ComboboxOption>();

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
			onValueChange?.(v ?? []);
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
		type: 'tag'
	});

	// null is treated as empty.
	const tags = $derived(field.value ?? []);
	const hasItems = $derived(items !== undefined);
	const atMaxTags = $derived(maxTags !== undefined && tags.length >= maxTags);

	// Resolve a tag's display label: static items, then session cache, else the raw value.
	const labelFor = (tagValue: string) => {
		if (Array.isArray(items)) {
			const staticOption = items.find((option) => option.value === tagValue);
			if (staticOption) return staticOption.label;
		}
		return optionCache.get(tagValue)?.label ?? tagValue;
	};

	// Load options state
	const getOptions = async (searchValue?: string | null, showAllOnFocus?: boolean) => {
		if (!hasItems) {
			return { options: [] as ComboboxOption[], error: null };
		}
		const isOptionsAsync = typeof items === 'function';
		if (!searchValue) {
			if (!showAllOnFocus || isOptionsAsync) {
				return { options: [] as ComboboxOption[], error: null };
			} else {
				return { options: items as ComboboxOption[], error: null };
			}
		} else {
			if (isOptionsAsync) {
				loading = true;
				try {
					const results = await items(searchValue);
					return { options: results as ComboboxOption[], error: null };
				} catch (error) {
					return {
						options: [] as ComboboxOption[],
						error: error instanceof Error ? error.message : t.failedToLoadOptions
					};
				} finally {
					loading = false;
				}
			} else {
				const result = (items as ComboboxOption[]).filter((option) =>
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

	// Options already selected are filtered out of the dropdown.
	const availableOptions = $derived(
		optionsAsync.options.filter((option) => !tags.includes(option.value))
	);

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
		if (!hasItems) return false;
		// Should show if
		// has error or has options or has no options and a search value
		// is focused
		return !!(
			field.focused &&
			(optionsAsync.error ||
				availableOptions.length > 0 ||
				(availableOptions.length === 0 && searchValue))
		);
	});

	// Add a tag value. Duplicates are never added (a duplicate add just clears the search),
	// and adds are ignored once maxTags is reached. Always assigns a fresh array.
	const addTag = (tagValue: string) => {
		const trimmed = tagValue.trim();
		if (!trimmed) return;
		searchValue = '';
		if (atMaxTags) return;
		if (tags.includes(trimmed)) return;
		field.value = [...tags, trimmed];
	};

	// Remove a tag value. Always assigns a fresh array.
	const removeTag = (tagValue: string) => {
		field.value = tags.filter((tag) => tag !== tagValue);
	};

	// Handle option selection: add the value, cache its label, clear search but keep focus.
	const handleSelectOption = (option: ComboboxOption) => {
		optionCache.set(option.value, option);
		addTag(option.value);
		// Keep focus in the input so multi-select can continue (differs from Combobox).
	};

	// Keyboard navigation: value-driven virtual focus over the available (non-selected) options.
	const nav = useListNavigation({
		values: () => availableOptions.map((option) => option.value),
		optionId,
		onSelect: (value) => {
			const option = availableOptions.find((opt) => opt.value === value);
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
		isActive: () => field.focused,
		keys: ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Home', 'End', 'Backspace'],
		preventDefault: false,
		callback: (event: KeyboardEvent) => {
			// Backspace on an empty input removes the last tag.
			if (event.key === 'Backspace') {
				if (!searchValue && tags.length > 0) {
					removeTag(tags[tags.length - 1]);
				}
				return;
			}

			if (event.key === 'Escape') {
				field.node?.blur();
				return;
			}

			// Enter adds free text in free mode (no items) or when customTags is enabled,
			// unless it maps to a highlighted dropdown option (handled by nav below).
			const canAddCustom = !hasItems || customTags;
			const hasDropdown = isOpen && availableOptions.length > 0;

			if (event.key === 'Enter') {
				if (hasDropdown && nav.highlighted !== undefined) {
					event.preventDefault();
					nav.onKeydown(event);
					return;
				}
				if (canAddCustom && searchValue.trim()) {
					event.preventDefault();
					addTag(searchValue);
				}
				return;
			}

			// Remaining navigation keys only matter when the dropdown is open.
			if (hasDropdown) {
				nav.onKeydown(event);
			}
		},
		onWindow: () => false // Only attach to input element, not window
	});

	onMount(async () => {
		// Resolve labels for pre-filled values via getValueOption.
		if (getValueOption && tags.length > 0) {
			for (const tagValue of tags) {
				if (!optionCache.has(tagValue)) {
					const option = await getValueOption(tagValue);
					if (option) {
						optionCache.set(option.value, option);
					}
				}
			}
		}
	});

	const classes = $derived(useTagsInputTheme(theme));
</script>

{#snippet tagsList()}
	<ul role="list" class="contents">
		{#each tags as tag (tag)}
			<li
				role="listitem"
				class={classes.tag({ size })}
				animate:flip={{ duration: 200 }}
				transition:scale={{ duration: 150, start: 0.8 }}
			>
				<Chip {size}>
					{labelFor(tag)}
					{#snippet suffix()}
						<button
							type="button"
							aria-label={t.remove(labelFor(tag))}
							onclick={() => removeTag(tag)}
							onmousedown={(e) => {
								e.stopPropagation();
								e.preventDefault();
							}}
							class="flex items-center justify-center opacity-70 transition-opacity hover:opacity-100"
						>
							{@render xIcon({ size: 14 })}
						</button>
					{/snippet}
				</Chip>
			</li>
		{/each}
	</ul>
{/snippet}

{#if hasItems}
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
			{:else if availableOptions.length === 0 && searchValue}
				<div class={classes.noOptions({ size })} role="status">{noOptionsText ?? t.noOptions}</div>
			{:else if availableOptions.length === 0 && !searchValue && showAllOnFocus}
				<div class={classes.noOptions({ size })} role="status">{noOptionsText ?? t.noOptions}</div>
			{:else if availableOptions.length > 0}
				<ScrollArea scrollOnEdges type="auto" class="flex max-h-[200px] flex-col gap-1">
					{#each availableOptions as option (option.value)}
						<MenuOption
							as="button"
							role="option"
							{size}
							{density}
							title={option.label}
							description={option.description}
							highlighted={nav.highlighted === option.value}
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
				{prefix}
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
				{@render tagsList()}
				<input
					data-1p-ignore
					type="text"
					{id}
					name={field.name}
					bind:value={searchValue}
					{placeholder}
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
					class={classes.input({ size, disabled: field.disabled })}
					{@attach keyDownHook.reference}
				/>
			</Field>
		{/snippet}
	</Popover>
{:else}
	<Field
		{density}
		{field}
		{size}
		{description}
		{prefix}
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
	>
		{@render tagsList()}
		<input
			data-1p-ignore
			type="text"
			{id}
			name={field.name}
			bind:value={searchValue}
			{placeholder}
			bind:this={field.node}
			bind:focused={field.focused}
			{disabled}
			autocomplete="off"
			class={classes.input({ size, disabled: field.disabled })}
			{@attach keyDownHook.reference}
		/>
	</Field>
{/if}
