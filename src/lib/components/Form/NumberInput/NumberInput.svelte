<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import Button from '../../Button/Button.svelte';
	import { minusIcon } from '../../Icons/minus.js';
	import { plusIcon } from '../../Icons/plus.js';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { useFieldTheme } from '../Field/field.theme.js';
	import { createFieldState, type FieldValidatorResult } from '../Field/field.state.svelte.js';
	import type { NumberInputCommitReason, NumberInputProps } from './numberInput.props.js';
	import { useNumberInputTheme } from './numberInput.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { composeHandlers } from '$lib/utils/handlers.js';
	import {
		cleanFloatingPoint,
		formatNumber,
		hasRoundingOptions,
		isNumberText,
		parseNumber,
		roundToFormat
	} from '$lib/utils/number.js';
	import { usePressAndHold } from '$lib/utils/usePressAndHold.svelte.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		placeholder = '',
		theme,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		onValueCommit,
		visible,
		min,
		max,
		step,
		increment,
		largeStep,
		smallStep,
		snapOnStep = false,
		wheelStep = false,
		showControls = true,
		format,
		locale,
		inputAttrs,
		...rest
	}: NumberInputProps = $props();
	const t = $derived(useI18n());
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const activeLocale = $derived(locale ?? t.locale);
	// Compact suffixes ("1.2K") cannot be read back, so entry always uses the standard notation.
	const entryFormat = $derived<Intl.NumberFormatOptions | undefined>(
		format?.notation === 'compact' ? { ...format, notation: 'standard' } : format
	);
	// Without a rounding option Intl shows at most three fraction digits; the value keeps its full
	// precision, so the text must too.
	const displayFormat = $derived<Intl.NumberFormatOptions>(
		hasRoundingOptions(entryFormat)
			? { ...entryFormat }
			: { ...entryFormat, maximumFractionDigits: 20 }
	);
	const allowNegative = $derived(min === undefined || min < 0);

	const formatValue = (number: number | null) => formatNumber(number, activeLocale, displayFormat);

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
		onValueChange: (v) => onValueChange?.(v),
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
		onValidate: (val): FieldValidatorResult => {
			if (typeof val === 'number') {
				if (min !== undefined && val < min) {
					return field.messages.rangeUnderflow(formatValue(min));
				}
				if (max !== undefined && val > max) {
					return field.messages.rangeOverflow(formatValue(max));
				}
			}
			return onValidate?.(val) || false;
		},
		get visible() {
			return visible;
		},
		type: 'number'
	});

	const classes = $derived(useNumberInputTheme(theme));
	const fieldClasses = $derived(useFieldTheme());

	const numericValue = $derived(
		typeof field.value === 'number' && Number.isFinite(field.value) ? field.value : null
	);

	// The text the input shows. It follows the user's typing as typed, and the value otherwise.
	let inputText = $state(untrack(() => formatValue(numericValue)));
	let inputFocused = $state(false);
	// Typed text that has not been committed (formatted, rounded and reported) yet.
	let textEdited = false;

	const parseText = (text: string): number | null =>
		text.trim() === '' ? null : parseNumber(text, activeLocale, entryFormat);

	// A value that changes from outside replaces the text; typing publishes the parsed value, which
	// then matches the text and leaves it alone.
	$effect.pre(() => {
		const next = numericValue;
		untrack(() => {
			if (!Object.is(parseText(inputText), next)) {
				inputText = formatValue(next);
				textEdited = false;
			}
		});
	});
	// The text follows a locale or format change, except while it is being typed.
	$effect.pre(() => {
		void activeLocale;
		void displayFormat;
		untrack(() => {
			if (!inputFocused) inputText = formatValue(numericValue);
		});
	});

	const sanitizeStep = (candidate: number | undefined, fallback: number) =>
		typeof candidate === 'number' && Number.isFinite(candidate) && candidate !== 0
			? Math.abs(candidate)
			: fallback;
	const baseStep = $derived(sanitizeStep(increment ?? step, 1));
	const largeAmount = $derived(sanitizeStep(largeStep, baseStep * 10));
	const smallAmount = $derived(sanitizeStep(smallStep, cleanFloatingPoint(baseStep / 10)));

	const locked = $derived(field.disabled || field.readOnly);
	const canDecrement = $derived(
		!locked && (numericValue === null || min === undefined || numericValue > min)
	);
	const canIncrement = $derived(
		!locked && (numericValue === null || max === undefined || numericValue < max)
	);

	// Whole, non-negative numbers get the digit pad; anything else needs the decimal point or sign.
	const inputMode = $derived<'decimal' | 'numeric'>(
		min !== undefined && min >= 0 && entryFormat?.maximumFractionDigits === 0
			? 'numeric'
			: 'decimal'
	);

	const countDecimalPlaces = (number: number) => {
		const text = String(number);
		if (text.includes('e-')) return Number(text.split('e-')[1]) || 0;
		return text.split('.')[1]?.length ?? 0;
	};

	const clampValue = (number: number) => {
		if (min !== undefined && number < min) return min;
		if (max !== undefined && number > max) return max;
		return number;
	};

	const computeStep = (base: number, direction: 1 | -1, amount: number) => {
		let next: number;
		const origin = min ?? 0;
		if (snapOnStep) {
			const position = (base - origin) / amount;
			const tolerance = 1e-9;
			const index =
				direction > 0 ? Math.floor(position + tolerance) + 1 : Math.ceil(position - tolerance) - 1;
			next = origin + index * amount;
		} else {
			next = base + direction * amount;
		}
		const precision = Math.min(
			Math.max(
				countDecimalPlaces(amount),
				countDecimalPlaces(base),
				snapOnStep ? countDecimalPlaces(origin) : 0
			),
			12
		);
		return clampValue(Number(next.toFixed(precision)));
	};

	const emptyBase = (direction: 1 | -1, amount: number) => {
		if (direction > 0 && min !== undefined) return min - amount;
		if (direction < 0 && max !== undefined) return max + amount;
		return 0;
	};

	/** Moves the value one step; returns whether it moved and whether it cannot move further. */
	const stepValue = (direction: 1 | -1, amount: number) => {
		if (locked) return { changed: false, atBound: true };
		const next = computeStep(numericValue ?? emptyBase(direction, amount), direction, amount);
		const changed = !Object.is(next, numericValue);
		setNumber(next);
		const atBound =
			direction > 0 ? max !== undefined && next >= max : min !== undefined && next <= min;
		return { changed, atBound };
	};

	/** Publishes `next` and shows it formatted. */
	const setNumber = (next: number | null) => {
		field.setValue(next);
		inputText = formatValue(numericValue);
		textEdited = false;
	};

	const emitCommit = (reason: NumberInputCommitReason) =>
		onValueCommit?.({ value: numericValue, reason });

	/** Formats, rounds and reports the typed text. */
	const commitText = (reason: NumberInputCommitReason) => {
		if (!textEdited) return;
		textEdited = false;
		const parsed = parseText(inputText);
		if (parsed === null) {
			// Empty clears the value; leftovers such as "-" go back to the value they never changed.
			if (inputText.trim() === '') field.setValue(null);
			inputText = formatValue(numericValue);
		} else {
			const rounded = roundToFormat(parsed, entryFormat);
			if (!Object.is(rounded, numericValue)) field.setValue(rounded);
			inputText = formatValue(numericValue);
		}
		emitCommit(reason);
	};

	const applyInputText = (input: HTMLInputElement) => {
		const text = input.value;
		if (text === inputText) return;
		if (locked || !isNumberText(text, activeLocale, entryFormat, { allowNegative })) {
			// Refused characters leave the text, and the caret, where they were.
			const caret = Math.max(
				0,
				(input.selectionStart ?? text.length) - (text.length - inputText.length)
			);
			input.value = inputText;
			input.setSelectionRange(caret, caret);
			return;
		}
		inputText = text;
		textEdited = true;
		const parsed = parseText(text);
		// Only text that is a complete number is published; "-" or "1e" wait for more typing.
		if (parsed !== null || text.trim() === '') field.setValue(parsed);
	};

	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		// An input method owns the text until compositionend.
		if ((event as unknown as InputEvent).isComposing) return;
		applyInputText(event.currentTarget);
	};

	const handleCompositionEnd = (event: Event & { currentTarget: HTMLInputElement }) =>
		applyInputText(event.currentTarget);

	const handlePaste = (event: ClipboardEvent & { currentTarget: HTMLInputElement }) => {
		const input = event.currentTarget;
		const pasted = (event.clipboardData?.getData('text/plain') ?? '').trim();
		event.preventDefault();
		if (
			locked ||
			pasted === '' ||
			!isNumberText(pasted, activeLocale, entryFormat, { allowNegative })
		) {
			return;
		}
		const start = input.selectionStart ?? input.value.length;
		const end = input.selectionEnd ?? start;
		input.setRangeText(pasted, start, end, 'end');
		applyInputText(input);
	};

	const handleKeydown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		if (event.isComposing || event.ctrlKey || event.metaKey) return;
		switch (event.key) {
			case 'ArrowUp':
			case 'ArrowDown':
			case 'PageUp':
			case 'PageDown': {
				if (locked) return;
				event.preventDefault();
				const direction = event.key === 'ArrowUp' || event.key === 'PageUp' ? 1 : -1;
				const amount =
					event.key.startsWith('Page') || event.shiftKey
						? largeAmount
						: event.altKey
							? smallAmount
							: baseStep;
				// Typed text is committed by the step: it steps from the number it holds.
				stepValue(direction, amount);
				emitCommit('keyboard');
				return;
			}
			case 'Home':
			case 'End': {
				const bound = event.key === 'Home' ? min : max;
				if (locked || bound === undefined) return;
				event.preventDefault();
				setNumber(bound);
				emitCommit('keyboard');
				return;
			}
			case 'Enter':
				// Formats what was typed; the Form still sees the key and moves on or submits.
				commitText('keyboard');
		}
	};

	const handleFocus = () => {
		inputFocused = true;
		field.focused = true;
	};

	const handleBlur = () => {
		inputFocused = false;
		field.focused = false;
		commitText('blur');
	};

	const inputElement = () => (field.node instanceof HTMLInputElement ? field.node : null);

	// Wheel steps are opt in: otherwise the wheel scrolls the page, even over a focused input.
	const wheel: Attachment<HTMLInputElement> = (node) => {
		if (!wheelStep) return;
		return on(
			node,
			'wheel',
			(event) => {
				const root = node.getRootNode() as Document | ShadowRoot;
				if (root.activeElement !== node || locked) return;
				const vertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
				// A horizontal gesture steps only with Shift; a trackpad's sideways drift never does.
				if (!vertical && !event.shiftKey) return;
				const delta = vertical ? event.deltaY : event.deltaX;
				if (delta === 0) return;
				event.preventDefault();
				stepValue(delta < 0 ? 1 : -1, baseStep);
				emitCommit('wheel');
			},
			{ passive: false }
		);
	};

	// Pressing a stepper keeps the caret where it is: focus stays in (or moves to) the input, so
	// the arrow keys keep working after a click.
	const keepInputFocus: Attachment<HTMLElement> = (node) => {
		const offs = [
			on(node, 'mousedown', (event) => event.preventDefault()),
			on(node, 'pointerdown', (event) => {
				// A touch press would raise the on-screen keyboard.
				if (event.button !== 0 || event.pointerType === 'touch' || locked) return;
				inputElement()?.focus({ preventScroll: true });
			})
		];
		return () => offs.forEach((off) => off());
	};

	const createStepper = (direction: 1 | -1) => {
		let stepped = false;
		const hold = usePressAndHold({
			onStep: () => {
				const result = stepValue(direction, baseStep);
				if (result.changed) stepped = true;
				return !result.atBound;
			},
			disabled: () => locked,
			// One commit for the whole press, when it ends.
			onStop: () => {
				if (!stepped) return;
				stepped = false;
				emitCommit('step');
			}
		});
		const onclick = (event: MouseEvent) => {
			if (hold.shouldSkipClick(event)) return;
			// Keyboard and assistive-technology activation, and a quick touch tap.
			if (stepValue(direction, baseStep).changed) emitCommit('step');
		};
		return { hold, onclick };
	};
	const decrementer = createStepper(-1);
	const incrementer = createStepper(1);
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
		data-1p-ignore
		autocomplete="off"
		autocorrect="off"
		spellcheck="false"
		{...inputAttrs}
		type="text"
		role="spinbutton"
		inputmode={inputMode}
		{id}
		bind:this={field.node}
		{@attach wheel}
		value={inputText}
		{placeholder}
		disabled={field.disabled}
		aria-required={field.required || undefined}
		aria-readonly={field.readOnly || undefined}
		aria-valuenow={numericValue ?? undefined}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuetext={numericValue === null ? undefined : inputText}
		class={classes.input({ disabled: field.disabled, size: rest.size })}
		oninput={composeHandlers(inputAttrs?.oninput, handleInput)}
		oncompositionend={composeHandlers(inputAttrs?.oncompositionend, handleCompositionEnd)}
		onpaste={composeHandlers(inputAttrs?.onpaste, handlePaste)}
		onkeydown={composeHandlers(inputAttrs?.onkeydown, handleKeydown)}
		onfocus={composeHandlers(inputAttrs?.onfocus, handleFocus)}
		onblur={composeHandlers(inputAttrs?.onblur, handleBlur)}
	/>
	<!-- The visible text is formatted for the locale; a native form posts the plain number. -->
	<FieldHiddenInputs {field} value={numericValue} />
	{#if showControls}
		<div class="flex shrink-0 items-stretch gap-0.5 self-stretch">
			<Button
				variant="ghost"
				color="neutral"
				size={rest.size}
				squared
				tabindex={-1}
				controls={id}
				label={`${t.decrease} ${t.value}`}
				disabled={!canDecrement}
				prefix={minusIcon}
				class={fieldClasses.actionButton({ size: rest.size, edge: 'none' })}
				onclick={decrementer.onclick}
				{@attach decrementer.hold.attachment}
				{@attach keepInputFocus}
			/>
			<Button
				variant="ghost"
				color="neutral"
				size={rest.size}
				squared
				tabindex={-1}
				controls={id}
				label={`${t.increase} ${t.value}`}
				disabled={!canIncrement}
				prefix={plusIcon}
				class={fieldClasses.actionButton({ size: rest.size, edge: 'end' })}
				onclick={incrementer.onclick}
				{@attach incrementer.hold.attachment}
				{@attach keepInputFocus}
			/>
		</div>
	{/if}
</Field>
