<script lang="ts">
	// Free text with suggestions. The value is the text in the input and the input submits it, so
	// a suggestion is a shortcut for typing, never a requirement. The list, its keyboard model,
	// async source and announcements are Combobox's controller; this file adds what only free
	// text needs: the text as the value, and inline completion that previews the highlighted
	// suggestion in the input without committing it.
	import { tick, untrack } from 'svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import Popover from '../../Popover/Popover.svelte';
	import type { PopoverApi } from '../../Popover/popover.api.js';
	import ComboboxPopup from '../Combobox/ComboboxPopup.svelte';
	import { ComboboxController } from '../Combobox/combobox.state.svelte.js';
	import { flattenItems } from '../Combobox/combobox.items.js';
	import type { ComboboxFilter } from '../Combobox/combobox.props.js';
	import { completeInline, normalizeSource } from './autocomplete.items.js';
	import type { AutocompleteProps } from './autocomplete.props.js';
	import { useAutocompleteTheme } from './autocomplete.theme.js';

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
		size = 'normal',
		density = 'normal',
		placeholder = '',
		items,
		mode = 'list',
		autoHighlight = false,
		openOnFocus = false,
		shouldFilter = true,
		filter,
		limit,
		loop,
		onSelect,
		onHighlightChange,
		loadingText,
		emptyText,
		autocomplete = 'off',
		separators = true,
		item,
		inputAttrs,
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
	}: AutocompleteProps = $props();
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
	let loading = $state(false);

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
			onValueChange?.(v);
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
		type: 'text'
	});

	// Only a name the app gave, directly or through Form, is submitted, as for a native input.
	const submittedName = $derived(
		field.name === `${field.type}-input-${field.id}` ? undefined : field.name
	);

	const text = $derived(field.value ?? '');
	const source = $derived(normalizeSource(items));
	// Inline and none modes list the suggestions as given; list and both narrow them to the text.
	const everything: ComboboxFilter = () => true;
	const narrowing = $derived(shouldFilter && (mode === 'list' || mode === 'both'));

	const controller = new ComboboxController({
		id,
		field,
		items: () => source,
		filter: () => (narrowing ? filter : everything),
		limit: () => limit,
		messages: () => t,
		loadingText: () => loadingText,
		noOptionsText: () => emptyText,
		query: {
			get: () => text,
			set: (next) => {
				field.setValue(next);
			}
		},
		// The text is a value here, not a search draft: a prefilled or just chosen text does not
		// ask the source anything until the list is open for it.
		searching: () => openState.value,
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
		openOnFocus: () => openOnFocus,
		autoHighlight: () => autoHighlight,
		loop: () => loop,
		onHighlightChange: () => onHighlightChange,
		onSelect: (option, event) => {
			previewing = null;
			field.setValue(option.label);
			controller.close({ reason: 'item-press', event });
			// The caret goes to the end of the chosen text once it is in the input.
			void tick().then(() => {
				const input = inputElement();
				if (input && input.ownerDocument.activeElement === input) {
					input.setSelectionRange(input.value.length, input.value.length);
				}
			});
			onSelect?.({ item: option, value: option.label, event });
		}
	});

	// -- Inline completion ----------------------------------------------------------------
	// While a suggestion is previewed the input shows its label but the value stays the typed
	// text, so `previewing.typed` is what Escape, blur and a closing list put back.

	const inputElement = () => field.node as HTMLInputElement | null;
	const inlineEnabled = $derived(
		(mode === 'both' || mode === 'inline') && !field.readOnly && !field.disabled
	);
	let previewing: { typed: string; text: string } | null = null;
	// Deleting the completion (or accepting it) must not bring it straight back.
	let holdCompletion = false;
	// The highlight change an ArrowUp or ArrowDown caused: the only kind that may replace the text
	// with a suggestion that does not continue it.
	let keyed: object | null = null;
	let composing = $state(false);
	let syncedText = untrack(() => text);

	const restorePreview = () => {
		if (!previewing) return;
		const { typed } = previewing;
		previewing = null;
		const input = inputElement();
		if (!input) return;
		input.value = typed;
		if (input.ownerDocument.activeElement === input)
			input.setSelectionRange(typed.length, typed.length);
	};

	// Keeps the input in step with the highlight: the highlighted suggestion is previewed while
	// keys or typing drive it. A hover leaves the text alone.
	$effect(() => {
		const current = text;
		const highlighted = controller.nav.highlighted;
		const details = controller.nav.highlightDetails;
		const listed = controller.expanded;
		const isFocused = field.focused;
		const enabled = inlineEnabled;
		const busy = composing;
		untrack(() => {
			const edited = current !== syncedText;
			syncedText = current;
			if (edited && previewing) {
				// The value moved on without the user's keys (the parent set it): drop the preview.
				const input = inputElement();
				if (input) input.value = current;
				previewing = null;
			}
			if (busy) return;
			if (!enabled || !listed || !isFocused || highlighted === undefined) {
				restorePreview();
				return;
			}
			const reason = details === keyed ? 'keyboard' : details.reason;
			if (reason === 'pointer') return;
			const option = flattenItems(controller.view.items).find(
				(entry) => entry.value === highlighted
			);
			const input = inputElement();
			if (!option || !input) {
				restorePreview();
				return;
			}
			const typed = previewing?.typed ?? current;
			const completion = completeInline(option.label, typed, t.locale);
			// The list's own choice (the first match as you type) only completes what was typed;
			// arrow keys may land anywhere.
			if (!completion || (reason === 'list' && (!completion.continues || holdCompletion))) {
				restorePreview();
				return;
			}
			if (
				input.value !== completion.text ||
				input.selectionStart !== completion.selectionStart ||
				input.selectionEnd !== completion.selectionEnd
			) {
				input.value = completion.text;
				input.setSelectionRange(completion.selectionStart, completion.selectionEnd);
			}
			previewing = { typed, text: completion.text };
		});
	});

	/** Makes the previewed text the typed text, as when the caret moves into it. */
	const acceptPreview = () => {
		const input = inputElement();
		if (!previewing || !input) return;
		const accepted = input.value;
		previewing = null;
		holdCompletion = true;
		field.setValue(accepted);
	};

	// -- Input events ---------------------------------------------------------------------

	const oninput = (event: Event & { currentTarget: HTMLInputElement }) => {
		inputAttrs?.oninput?.(event);
		const inputType = event instanceof InputEvent ? event.inputType : '';
		holdCompletion = inputType.startsWith('delete');
		// What is in the input is now the typed text, previewed or not.
		previewing = null;
		field.setValue(event.currentTarget.value);
		if (!field.readOnly) controller.onInput(event);
	};

	const onkeydown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		inputAttrs?.onkeydown?.(event);
		if (event.defaultPrevented) return;
		const plain = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
		if (previewing && !event.isComposing) {
			if (event.key === 'Escape') {
				// One Escape puts the typed text back and closes the list.
				restorePreview();
			} else if (
				event.key === 'Tab' ||
				(plain && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
			) {
				acceptPreview();
			}
		}
		// Home and End move the caret in a text field; they do not jump through the list.
		if ((event.key === 'Home' || event.key === 'End') && !event.shiftKey) return;
		if (event.key !== 'Escape') holdCompletion = false;
		controller.onKeydown(event);
		const moved = controller.nav.highlightDetails;
		if (moved.event === event) keyed = moved;
	};

	const classes = $derived(useAutocompleteTheme(theme));
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
		isSelected={() => false}
	/>
	{#snippet trigger(popover: PopoverApi)}
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
			<input
				data-1p-ignore={autocomplete === 'off' ? '' : undefined}
				{...inputAttrs}
				type="text"
				{id}
				name={submittedName}
				value={text}
				{placeholder}
				{autocomplete}
				required={field.required}
				readonly={field.readOnly}
				disabled={field.disabled}
				bind:this={field.node}
				bind:focused={field.focused}
				role="combobox"
				aria-expanded={controller.expanded}
				aria-controls={controller.expanded ? controller.listboxId : undefined}
				aria-autocomplete={mode}
				aria-activedescendant={controller.activeDescendant}
				aria-haspopup="listbox"
				aria-invalid={controller.error !== null || undefined}
				class={classes.input({ size, hasValue: text !== '', disabled: field.disabled })}
				{oninput}
				{onkeydown}
				onfocus={(event) => {
					inputAttrs?.onfocus?.(event);
					controller.onFocus(event);
				}}
				onpointerdown={(event) => {
					inputAttrs?.onpointerdown?.(event);
					if (!event.defaultPrevented) controller.onPointerDown();
				}}
				onclick={(event) => {
					inputAttrs?.onclick?.(event);
					if (!event.defaultPrevented) controller.onClick(event);
				}}
				oncompositionstart={(event) => {
					inputAttrs?.oncompositionstart?.(event);
					composing = true;
				}}
				oncompositionend={(event) => {
					inputAttrs?.oncompositionend?.(event);
					composing = false;
				}}
			/>
			<!-- Persistent, so it exists before the first announcement: result counts and status. -->
			<span class="sr-only" {...controller.announcer.regionAttrs}>
				{controller.announcer.message}
			</span>
		</Field>
	{/snippet}
</Popover>
