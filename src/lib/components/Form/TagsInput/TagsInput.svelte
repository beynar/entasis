<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { TagsInputProps } from './tagsInput.props.js';
	import type { ComboboxOption } from '../Combobox/combobox.props.js';
	import Chip from '../../Chip/Chip.svelte';
	import Popover from '../../Popover/Popover.svelte';
	import { xIcon } from '../../Icons/x.js';
	import type { PopoverState } from '../../Popover/popover.state.svelte.js';
	import { useTagsInputTheme } from './tagsInput.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import { flattenItems } from '../Combobox/combobox.items.js';
	import { ComboboxController } from '../Combobox/combobox.state.svelte.js';
	import ComboboxPopup from '../Combobox/ComboboxPopup.svelte';
	import { tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
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
		customTags = false,
		maxTags,
		keepSearchOnSelect = false,
		openOnFocus,
		showAllOnFocus = false,
		filter,
		limit,
		autoHighlight,
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
	}: TagsInputProps = $props();
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
		type: 'tag'
	});

	// null is treated as empty.
	const tags = $derived(field.value ?? []);
	const hasItems = $derived(items !== undefined);
	const atMaxTags = $derived(maxTags !== undefined && tags.length >= maxTags);
	// Tags can be removed while the field is editable; a disabled or read-only field keeps them
	// as plain text, with no remove buttons to tab to.
	const removable = $derived(!field.disabled && !field.readOnly);

	const controller = new ComboboxController({
		id,
		field,
		items: () => items,
		filter: () => filter,
		limit: () => limit,
		// Options already selected are left out of the dropdown.
		exclude: (option) => tags.includes(option.value),
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
		// With free text allowed, Enter adds what was typed unless an option was highlighted by hand.
		autoHighlight: () => autoHighlight ?? (customTags ? false : 'always'),
		loop: () => loop,
		onHighlightChange: () => onHighlightChange,
		onSelect: (option) => {
			optionCache.set(option.value, option);
			addTag(option.value, { keepQuery: keepSearchOnSelect });
			// Focus stays in the input so multi-select can continue (differs from Combobox).
		}
	});

	// Resolve a tag's display label: static items, then session cache, else the raw value.
	const labelFor = (tagValue: string) => {
		if (Array.isArray(items)) {
			const staticOption = flattenItems(items).find((option) => option.value === tagValue);
			if (staticOption) return staticOption.label;
		}
		return optionCache.get(tagValue)?.label ?? tagValue;
	};

	// Add a tag value. Duplicates are never added (a duplicate add just clears the search),
	// and adds are ignored once maxTags is reached. Always assigns a fresh array.
	const addTag = (tagValue: string, { keepQuery = false }: { keepQuery?: boolean } = {}) => {
		const trimmed = tagValue.trim();
		if (!trimmed || field.disabled || field.readOnly) return;
		if (!keepQuery) searchValue = '';
		if (atMaxTags) return;
		if (tags.includes(trimmed)) return;
		field.setValue([...tags, trimmed]);
	};

	// Remove a tag value. Always assigns a fresh array.
	const removeTag = (tagValue: string) => {
		if (field.disabled || field.readOnly) return;
		field.setValue(tags.filter((tag) => tag !== tagValue));
	};

	let toolbar = $state<HTMLElement | null>(null);
	const direction = useDirection(() => field.node);
	// A removed tag stays in the DOM until its exit transition ends: only live tags count.
	const chipButtons = () =>
		Array.from(toolbar?.querySelectorAll<HTMLButtonElement>('button[data-tag]') ?? []).filter(
			(button) => tags.includes(button.dataset.tag ?? '')
		);

	// Remove the tag of a focused remove button and hand focus to its neighbour (the input after
	// the last one), so the focused button leaving the DOM never drops focus to the body.
	const removeFocusedTag = (button: HTMLButtonElement) => {
		const tag = button.dataset.tag;
		if (tag === undefined) return;
		const index = chipButtons().indexOf(button);
		const hadFocus = button.ownerDocument.activeElement === button;
		removeTag(tag);
		if (!hadFocus) return;
		void tick().then(() => {
			const remaining = chipButtons();
			(remaining[index] ?? remaining[index - 1] ?? field.node)?.focus();
		});
	};

	// The remove buttons are one roving tab stop: arrows move between them, the others are out of
	// the tab order.
	const navigation = useNavigation({
		enabled: () => removable,
		orientation: 'horizontal',
		loop: false,
		focusableContainer: false
	});

	// Backspace and Delete remove the focused tag and hand focus to its neighbour (the input
	// after the last one); the arrow past the last tag returns to the input.
	const toolbarKeys: Attachment<HTMLElement> = (node) =>
		on(
			node,
			'keydown',
			(event) => {
				const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
					'button[data-tag]'
				);
				if (!button || event.defaultPrevented || !removable) return;
				const buttons = chipButtons();
				const index = buttons.indexOf(button);
				const towardInput = direction() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
				if (event.key === 'Backspace' || event.key === 'Delete') {
					event.preventDefault();
					event.stopPropagation();
					removeFocusedTag(button);
				} else if (event.key === towardInput && index === buttons.length - 1) {
					event.preventDefault();
					event.stopPropagation();
					field.node?.focus();
				}
			},
			{ capture: true }
		);

	const onKeydown = (event: KeyboardEvent) => {
		if (event.defaultPrevented || event.isComposing) return;
		const input = event.currentTarget as HTMLInputElement;
		// Backspace on an empty input removes the last tag.
		if (event.key === 'Backspace') {
			if (!searchValue && tags.length > 0) removeTag(tags[tags.length - 1]);
			return;
		}

		// The arrow toward the tags, at the start of the text, steps into them.
		const towardTags = direction() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
		if (
			event.key === towardTags &&
			removable &&
			tags.length > 0 &&
			!event.shiftKey &&
			input.selectionStart === 0 &&
			input.selectionEnd === 0
		) {
			event.preventDefault();
			chipButtons().at(-1)?.focus();
			return;
		}

		// Enter adds free text in free mode (no items) or when customTags is enabled, unless an
		// option is highlighted.
		const canAddCustom = !hasItems || customTags;
		if (event.key === 'Enter') {
			const optionHighlighted = controller.expanded && controller.nav.highlighted !== undefined;
			if (!optionHighlighted && canAddCustom && searchValue.trim() && removable) {
				event.preventDefault();
				addTag(searchValue);
				return;
			}
		}
		controller.onKeydown(event);
	};

	// Resolve labels for values the options don't name (pre-filled tags, tags set from outside).
	// Plain set on purpose: bookkeeping for the effect below, not state anything renders.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const requested = new Set<string>();
	$effect(() => {
		if (!getValueOption) return;
		const unnamed = tags.filter((tag) => !optionCache.has(tag));
		untrack(() => {
			for (const tagValue of unnamed) {
				if (requested.has(tagValue)) continue;
				requested.add(tagValue);
				void Promise.resolve(getValueOption(tagValue)).then((option) => {
					if (option) optionCache.set(option.value, option);
				});
			}
		});
	});

	const classes = $derived(useTagsInputTheme(theme));
</script>

{#snippet tagsList()}
	<!-- Removable tags form a toolbar (one tab stop, arrows between the remove buttons); tags that
	     cannot be removed are a plain list. -->
	<div
		bind:this={toolbar}
		role={tags.length === 0 ? undefined : removable ? 'toolbar' : 'list'}
		aria-label={tags.length === 0 ? undefined : t.tags}
		aria-orientation={tags.length > 0 && removable ? 'horizontal' : undefined}
		class="contents"
		{@attach navigation.containerReference}
		{@attach toolbarKeys}
	>
		{#each tags as tag (tag)}
			<span
				role={removable ? undefined : 'listitem'}
				class={classes.tag({ size })}
				animate:flip={{ duration: 200 }}
				transition:scale={{ duration: 150, start: 0.8 }}
			>
				{#if removable}
					<Chip {size}>
						{labelFor(tag)}
						{#snippet suffix()}
							<button
								type="button"
								data-tag={tag}
								aria-label={t.remove(labelFor(tag))}
								onclick={(event) => removeFocusedTag(event.currentTarget)}
								onmousedown={(e) => {
									e.stopPropagation();
									e.preventDefault();
								}}
								class="focus-visible:ring-focus/50 flex items-center justify-center rounded-full opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2"
								{@attach navigation.itemReference}
							>
								{@render xIcon({ size: 14 })}
							</button>
						{/snippet}
					</Chip>
				{:else}
					<Chip {size}>{labelFor(tag)}</Chip>
				{/if}
			</span>
		{/each}
	</div>
{/snippet}

{#snippet fieldView(popover: PopoverState | null)}
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
		{@attach popover?.reference}
	>
		{@render tagsList()}
		<input
			data-1p-ignore
			type="text"
			{id}
			bind:value={searchValue}
			{placeholder}
			bind:this={field.node}
			bind:focused={field.focused}
			disabled={field.disabled}
			role={hasItems ? 'combobox' : undefined}
			aria-expanded={hasItems ? controller.expanded : undefined}
			aria-controls={hasItems && controller.expanded ? controller.listboxId : undefined}
			aria-autocomplete={hasItems ? 'list' : undefined}
			aria-activedescendant={hasItems ? controller.activeDescendant : undefined}
			aria-haspopup={hasItems ? 'listbox' : undefined}
			aria-invalid={hasItems ? controller.error !== null : undefined}
			autocomplete="off"
			class={classes.input({ size, disabled: field.disabled })}
			oninput={(event) => controller.onInput(event)}
			onkeydown={onKeydown}
			onfocus={(event) => controller.onFocus(event)}
			onpointerdown={() => controller.onPointerDown()}
			onclick={(event) => controller.onClick(event)}
		/>
		<!-- The search box holds a draft: the tags are what a native form submits, one per tag. -->
		<FieldHiddenInputs {field} value={tags} />
		{#if hasItems}
			<!-- Persistent, so it exists before the first announcement: result counts and status. -->
			<span class="sr-only" {...controller.announcer.regionAttrs}>
				{controller.announcer.message}
			</span>
		{/if}
	</Field>
{/snippet}

{#if hasItems}
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
		<ComboboxPopup {controller} {classes} {size} {density} {separators} {item} {i18n} />
		{#snippet trigger(popover: PopoverState)}
			{@render fieldView(popover)}
		{/snippet}
	</Popover>
{:else}
	{@render fieldView(null)}
{/if}
