<script lang="ts">
	import { onMount } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { eyedropperIcon } from '../../Icons/eyedropper.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { alphaMask, colorMask } from './colorMask.js';
	import type { ColorPickerProps } from './colorPicker.props.js';
	import { ColorPickerState } from './colorPicker.state.svelte.js';
	import { useColorPickerTheme } from './colorPicker.theme.js';

	let {
		defaultValue = '#000000',
		value = $bindable(),
		format = $bindable('hex'),
		size = 'normal',
		disabled = false,
		onValueChange,
		class: className,
		theme,
		i18n,
		...attachments
	}: ColorPickerProps = $props();
	const valueState = createBindableValue(
		() => value,
		(nextValue) => {
			value = nextValue;
		},
		() => defaultValue
	);

	const picker = new ColorPickerState({
		get value() {
			return valueState.value;
		},
		set value(v) {
			valueState.value = v;
		},
		get format() {
			return format;
		},
		set format(v) {
			format = v;
		},
		get disabled() {
			return disabled;
		},
		onValueChange: (v) => onValueChange?.(v)
	});

	const t = $derived(useI18n(i18n));
	const classes = $derived(useColorPickerTheme(theme));

	const iconClass = $derived(
		size === 'small' ? 'size-3.5' : size === 'large' ? 'size-5' : 'size-4'
	);

	// The native EyeDropper API is not in every browser (and absent during SSR); enable the button
	// only once we can confirm support on the client.
	let eyeDropperSupported = $state(false);
	onMount(() => {
		eyeDropperSupported = 'EyeDropper' in window;
	});

	const openEyeDropper = async () => {
		if (!eyeDropperSupported || disabled) return;
		try {
			const EyeDropperCtor = (
				window as unknown as {
					EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
				}
			).EyeDropper;
			const result = await new EyeDropperCtor().open();
			if (result?.sRGBHex) picker.commitText(result.sRGBHex);
		} catch {
			// The user dismissed the eyedropper; nothing to commit.
		}
	};

	// The color text input is edited freely as a local draft, then committed (or reverted) on blur/Enter.
	let editingText = $state(false);
	let textDraft = $state('');
	const textValue = $derived(editingText ? textDraft : picker.formatted);

	const onColorFocus = () => {
		editingText = true;
		textDraft = picker.formatted;
	};
	const onColorInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		editingText = true;
		textDraft = event.currentTarget.value;
	};
	const commitColorText = () => {
		picker.commitText(textDraft);
		// Whether or not it parsed, leave edit mode so the input snaps back to the canonical formatted value.
		editingText = false;
	};
	const onColorKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitColorText();
		}
	};

	const onAlphaChange = (event: Event & { currentTarget: HTMLInputElement }) => {
		const parsed = Number.parseInt(event.currentTarget.value, 10);
		if (!Number.isNaN(parsed)) {
			picker.setAlphaPercent(Math.min(100, Math.max(0, parsed)));
		}
		// Always snap the field back to the canonical percent: covers non-numeric entries and
		// out-of-range values that clamp to the current alpha (where no state change re-renders).
		event.currentTarget.value = `${picker.alphaPercent}`;
	};
</script>

<div class={classes.root({ size, disabled, className })} {...attachments}>
	<!-- Saturation / value square: solid hue backdrop + white and black gradient overlays. -->
	<div
		class={classes.area({ size, disabled })}
		style="background-color: {picker.hueColor};"
		{@attach picker.area}
	>
		<div class={classes.areaSaturation()}></div>
		<div class={classes.areaValue()}></div>
		<div
			class={classes.areaThumb({ size })}
			style="left: {picker.areaThumbLeft}%; top: {picker.areaThumbTop}%;"
			role="slider"
			tabindex={disabled ? -1 : 0}
			aria-label={`${t.saturation} ${t.and} ${t.brightness}`}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(picker.s * 100)}
			aria-valuetext={`${Math.round(picker.s * 100)}% ${t.saturation}, ${Math.round(
				picker.v * 100
			)}% ${t.brightness}`}
			aria-disabled={disabled || undefined}
			onkeydown={picker.onAreaKeydown}
		></div>
	</div>

	<!-- Eyedropper + stacked hue / alpha sliders. -->
	<div class={classes.controls({ size })}>
		<button
			type="button"
			class={classes.eyedropperButton({ size })}
			disabled={disabled || !eyeDropperSupported}
			aria-label={t.pickColorFromScreen}
			onclick={openEyeDropper}
		>
			{@render eyedropperIcon({ class: iconClass })}
		</button>

		<div class={classes.sliders({ size })}>
			<div class={classes.hueTrack({ size, disabled })} {@attach picker.hueSlider}>
				<div
					class={classes.sliderThumb({ size })}
					style="left: {picker.hueThumbLeft}%;"
					role="slider"
					tabindex={disabled ? -1 : 0}
					aria-label={t.hue}
					aria-valuemin={0}
					aria-valuemax={360}
					aria-valuenow={Math.round(picker.h)}
					aria-disabled={disabled || undefined}
					onkeydown={picker.onHueKeydown}
				></div>
			</div>

			<div class={classes.alphaTrack({ size, disabled })} {@attach picker.alphaSlider}>
				<div
					class={classes.alphaGradient()}
					style="background: linear-gradient(to right, transparent, {picker.solidColor});"
				></div>
				<div
					class={classes.sliderThumb({ size })}
					style="left: {picker.alphaThumbLeft}%;"
					role="slider"
					tabindex={disabled ? -1 : 0}
					aria-label={t.alpha}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={picker.alphaPercent}
					aria-disabled={disabled || undefined}
					onkeydown={picker.onAlphaKeydown}
				></div>
			</div>
		</div>
	</div>

	<!-- Format select + color text input + alpha percentage input. -->
	<div class={classes.inputs({ size })}>
		<select
			class={classes.select({ size })}
			bind:value={format}
			{disabled}
			aria-label={`${t.color} ${t.format}`}
		>
			<option value="hex">HEX</option>
			<option value="rgb">RGB</option>
			<option value="hsl">HSL</option>
		</select>

		<input
			type="text"
			class={classes.input({ size })}
			value={textValue}
			{disabled}
			spellcheck="false"
			autocomplete="off"
			autocapitalize="off"
			aria-label={`${t.color} ${t.value}`}
			{@attach colorMask({ format: () => format })}
			onfocus={onColorFocus}
			oninput={onColorInput}
			onblur={commitColorText}
			onkeydown={onColorKeydown}
		/>

		<!-- The text input is alpha-less in every format; the % field carries alpha, so the row
		     stays identical across hex/rgb/hsl. -->
		<div class={classes.alphaField({ size })}>
			<!-- Maskito needs a text input; the 0-100 number mask blocks out-of-range entry. -->
			<input
				type="text"
				inputmode="numeric"
				class={classes.alphaInput({ size })}
				value={picker.alphaPercent}
				{disabled}
				aria-label={`${t.alpha} ${t.percentage}`}
				{@attach alphaMask}
				onchange={onAlphaChange}
			/>
			<span class={classes.alphaSuffix({ size })}>%</span>
		</div>
	</div>
</div>
