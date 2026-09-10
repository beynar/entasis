<script lang="ts">
	import { untrack } from 'svelte';
	import { addAlphaToHex, isValidColor, parseCSS, rgb2hex, rgb2hsl } from 'colorizr';
	import ColorPicker from '../ColorPicker/ColorPicker.svelte';
	import { closeFunctional, colorMask } from '../ColorPicker/colorMask.js';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import Popover from '../../Popover/Popover.svelte';
	import type { PopoverState } from '../../Popover/popover.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { ColorInputProps } from './colorInput.props.js';
	import { useColorInputTheme } from './colorInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		format = $bindable('hex'),
		required = false,
		placeholder = '',
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		i18n,
		...rest
	}: ColorInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	let isPickerOpen = $state(false);

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
		type: 'color'
	});

	const t = $derived(useI18n(i18n));
	const classes = $derived(useColorInputTheme(theme));

	// Like DateInput's format-pattern placeholder: hint the masked shape of the selected format.
	const formatPlaceholders = {
		hex: '#rrggbb',
		rgb: 'rgb(r, g, b)',
		hsl: 'hsl(h, s%, l%)'
	} as const;
	const effectivePlaceholder = $derived(placeholder || formatPlaceholders[format ?? 'hex']);

	const round = (input: number, decimals: number) => {
		const factor = 10 ** decimals;
		return Math.round(input * factor) / factor;
	};

	// Render the canonical value in the currently selected text format (hex/rgb/hsl). Any alpha < 1
	// widens hex to #rrggbbaa and switches rgb/hsl to their `a` forms. Non-hex CSS input (e.g. a named
	// color) is normalized to the selected format. Unparseable drafts are returned untouched.
	const formatColor = (color: string | null | undefined): string => {
		if (!color) return '';
		if (!isValidColor(color)) return color;
		let rgb;
		try {
			rgb = parseCSS(color, 'rgb');
		} catch {
			return color;
		}
		const a = typeof rgb.alpha === 'number' ? rgb.alpha : 1;
		if (format === 'rgb') {
			return a < 1
				? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round(a, 2)})`
				: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
		}
		if (format === 'hsl') {
			const { h, s, l } = rgb2hsl([rgb.r, rgb.g, rgb.b]);
			return a < 1
				? `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${round(a, 2)})`
				: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
		}
		const solid = rgb2hex([rgb.r, rgb.g, rgb.b]);
		return a < 1 ? addAlphaToHex(solid, a) : solid;
	};

	// Parse any parseable CSS color into the canonical hex; null when unparseable (caller ignores it,
	// leaving the draft text to be reverted on blur).
	const toHex = (input: string): string | null => {
		const trimmed = input?.trim() ? closeFunctional(input.trim()) : '';
		if (!trimmed || !isValidColor(trimmed)) return null;
		let rgb;
		try {
			rgb = parseCSS(trimmed, 'rgb');
		} catch {
			return null;
		}
		const solid = rgb2hex([rgb.r, rgb.g, rgb.b]);
		const a = typeof rgb.alpha === 'number' ? rgb.alpha : 1;
		return a < 1 ? addAlphaToHex(solid, a) : solid;
	};

	// Uncontrolled input: write the formatted value straight onto the node so typing is never fought.
	const syncInputValue = () => {
		if (field.node instanceof HTMLInputElement) {
			field.node.value = formatColor(field.value);
		}
	};

	const handleInput = (event: Event) => {
		const raw = (event.currentTarget as HTMLInputElement).value;
		if (!raw.trim()) {
			field.value = null;
			return;
		}
		const hex = toHex(raw);
		if (hex) {
			field.value = hex;
		}
		// Unparseable text stays as typed; the blur effect below reverts it to the canonical value.
	};

	// Reformat the input from the canonical value whenever the value or format changes and the field
	// is not being edited (so a live draft is never clobbered; blur reverts unparseable drafts).
	$effect(() => {
		void value;
		void format;
		if (!field.focused) {
			syncInputValue();
		}
	});

	const isEmpty = $derived(!field.value);
</script>

<Popover
	id={`${id}-color-popover`}
	bind:open={isPickerOpen}
	position="bottom-start"
	size="normal"
	class={classes.popover({ class: theme?.popover?.base })}
>
	<div id={`${id}-color-picker`} aria-label={`${t.choose} ${t.color}`}>
		<ColorPicker
			value={field.value ?? undefined}
			bind:format
			size={rest.size}
			disabled={field.disabled}
			{i18n}
			onValueChange={(hex) => {
				field.value = hex;
			}}
		/>
	</div>

	{#snippet trigger(popover: PopoverState)}
		{#snippet swatch()}
			<span class={classes.swatch({ empty: isEmpty, class: theme?.swatch?.base })}>
				{#if !isEmpty}
					<span class="absolute inset-0" style="background-color: {field.value};"></span>
				{/if}
			</span>
		{/snippet}
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
			{@attach popover.reference}
		>
			<!-- Same primitive as the password visibility toggle: the action button stretches to the
			     field's full height/padding, so the click target is much larger than the swatch itself. -->
			<FieldActionButton
				edge="start"
				active={isPickerOpen}
				size={rest.size}
				label={`${t.choose} ${t.color}`}
				aria-haspopup="dialog"
				aria-expanded={isPickerOpen}
				aria-controls={isPickerOpen ? `${id}-color-picker` : undefined}
				disabled={field.disabled}
				prefix={swatch}
				onclick={() => {
					if (!field.disabled) {
						popover.toggle();
					}
				}}
			/>
			<input
				data-1p-ignore
				type="text"
				{id}
				name={field.name}
				bind:this={field.node}
				placeholder={effectivePlaceholder}
				disabled={field.disabled}
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
				aria-label={`${t.color} ${t.value}`}
				class={classes.input({ disabled: field.disabled, size: rest.size })}
				{@attach colorMask({ format: () => format })}
				oninput={handleInput}
				onfocus={() => {
					field.focused = true;
					if (!field.disabled) {
						isPickerOpen = true;
					}
				}}
				onblur={() => {
					field.focused = false;
				}}
			/>
		</Field>
	{/snippet}
</Popover>
