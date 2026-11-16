<script lang="ts">
	import { untrack } from 'svelte';
	import { Maskito } from '@maskito/core';
	import { boundDefault } from '$lib/utils/state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { resolveControlId } from '../Field/field.aria.js';
	import { createFieldState, type FieldValidatorResult } from '../Field/field.state.svelte.js';
	import { createMaskEngine, type MaskedInputValueDetails } from './maskedInput.mask.js';
	import {
		createMaskedInputMaskito,
		maskValue,
		type MaskedInputMaskito
	} from './maskedInput.maskito.js';
	import type { MaskedInputProps } from './maskedInput.props.js';
	import { useMaskedInputTheme } from './maskedInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		mask,
		tokens,
		placeholderChar = '_',
		showMask = 'never',
		valueFormat = 'raw',
		required = false,
		placeholder,
		inputMode,
		autocomplete,
		inputAttrs,
		theme,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		onMaskedChange,
		visible,
		id: idProp,
		...rest
	}: MaskedInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => boundDefault(defaultValue));

	const generatedId = $props.id();
	const id = untrack(() => resolveControlId(idProp, inputAttrs, generatedId));

	const engine = $derived(createMaskEngine({ mask, tokens, placeholderChar }));
	const maskito = $derived(createMaskedInputMaskito(engine, showMask));

	const toValue = (details: MaskedInputValueDetails): string | null => {
		const text = valueFormat === 'masked' ? details.masked : details.raw;
		return text === '' ? null : text;
	};
	// Any text, raw or formatted, read through the mask as Maskito would format it.
	const detailsOf = (text: string | null | undefined): MaskedInputValueDetails =>
		engine.details(text ? maskValue(engine, String(text)) : '');
	const normalize = (text: string | null | undefined): string | null =>
		text === null || text === undefined || text === '' ? null : toValue(detailsOf(text));
	// The value the field holds, always in `valueFormat`, whatever form the parent wrote it in.
	const normalized = $derived(normalize(value));
	// What the input showed at the last edit, so the callback reports the text the user sees.
	let lastDetails: MaskedInputValueDetails | null = null;

	const incompleteMessage = (text: string) => {
		if (messages?.incomplete === undefined) return t.maskedInputIncomplete;
		const reading = engine.read(maskValue(engine, text));
		return field.messages.incomplete(reading.pattern.requiredSlots);
	};

	const field = createFieldState({
		id,
		get value() {
			return normalized;
		},
		set value(v) {
			value = normalize(v);
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
			const details =
				lastDetails && toValue(lastDetails) === (v ?? null) ? lastDetails : detailsOf(v);
			onValueChange?.(v ?? null);
			onMaskedChange?.(details);
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
		// A value that leaves required slots empty is invalid, required or not.
		onValidate: (current): FieldValidatorResult => {
			if (typeof current === 'string' && current !== '' && !detailsOf(current).complete) {
				return incompleteMessage(current);
			}
			return onValidate?.(current) || false;
		},
		get visible() {
			return visible;
		},
		type: 'masked'
	});

	const classes = $derived(useMaskedInputTheme(theme));
	const resolvedInputMode = $derived(
		inputMode ?? inputAttrs?.inputmode ?? (engine.numeric ? 'numeric' : 'text')
	);
	const resolvedPlaceholder = $derived(placeholder ?? engine.tail(''));
	// The server renders the formatted value; the client takes over from Maskito once attached.
	const initialText = untrack(() => maskito.display(normalized ?? '', false));

	const showsFocus = (input: HTMLInputElement) =>
		input.ownerDocument.activeElement === input && !input.readOnly && !input.disabled;

	const writeInput = (
		input: HTMLInputElement,
		current: MaskedInputMaskito,
		text: string | null
	) => {
		current.sync(maskValue(engine, text ?? ''));
		input.value = current.display(text ?? '', showsFocus(input));
	};

	const attachMask = (input: HTMLInputElement) => {
		const current = maskito;
		const instance = new Maskito(input, current.options);
		untrack(() => writeInput(input, current, normalized));
		return () => instance.destroy();
	};

	// A value set from outside rewrites the input; an edit the input already shows does not, so
	// the caret stays where the user put it.
	$effect(() => {
		const next = normalized;
		const current = maskito;
		untrack(() => {
			const input = field.node;
			if (!(input instanceof HTMLInputElement)) return;
			if (toValue(engine.details(current.strip(input.value))) === next) return;
			writeInput(input, current, next);
		});
	});

	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		inputAttrs?.oninput?.(event);
		const details = engine.details(maskito.strip(event.currentTarget.value));
		lastDetails = details;
		field.value = toValue(details);
		lastDetails = null;
	};
</script>

<Field
	{field}
	size={rest.size}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: field.disabled,
				size: rest.size
			})
		}
	}}
	{...rest}
>
	<input
		{...inputAttrs}
		dir={inputAttrs?.dir ?? 'ltr'}
		type="text"
		{id}
		value={initialText}
		inputmode={resolvedInputMode}
		{autocomplete}
		disabled={field.disabled}
		placeholder={resolvedPlaceholder}
		bind:this={field.node}
		{@attach attachMask}
		oninput={handleInput}
		onfocus={(event) => {
			inputAttrs?.onfocus?.(event);
			field.focused = true;
		}}
		onblur={(event) => {
			inputAttrs?.onblur?.(event);
			field.focused = false;
		}}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
		{...field.ariaAttrs({ role: 'textbox', native: 'text', attrs: inputAttrs })}
		aria-required={field.required ? 'true' : undefined}
	/>
	<FieldHiddenInputs {field} value={field.value} />
</Field>
