<script lang="ts">
	import { untrack } from 'svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import SliderTrack from './SliderTrack.svelte';
	import SliderValueLabels from './SliderValueLabels.svelte';
	import type { SliderProps } from './slider.props.js';
	import { SliderState } from './slider.state.svelte.js';
	import { useSliderTheme } from './slider.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { useDefaultColor } from '../../Theme/theme.state.svelte.js';

	let {
		min = 0,
		max = 100,
		step = 1,
		defaultValue = min,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		visible,
		onValueChange,
		color,
		marks = [],
		showValue = false,
		formatValue,
		valueLabel,
		rangeLabel,
		mode = 'single',
		variant = 'default',
		thumbs,
		orientation = 'horizontal',
		minStepsBetweenThumbs = 0,
		dragRange = false,
		thumbLabels = [],
		size = 'normal',
		i18n,
		label,
		...rest
	}: SliderProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const t = $derived(useI18n(i18n));
	const resolvedColor = $derived(useDefaultColor(color));

	const id = $props.id();

	const slider = new SliderState({
		get value() {
			return value;
		},
		set value(v) {
			field.setValue(v);
		},
		get min() {
			return min;
		},
		get max() {
			return max;
		},
		get step() {
			return step;
		},
		get thumbs() {
			return thumbs ?? (mode === 'range' ? 2 : undefined);
		},
		get minStepsBetweenThumbs() {
			return minStepsBetweenThumbs;
		},
		get orientation() {
			return orientation;
		},
		get disabled() {
			return disabled;
		},
		get dragRange() {
			return dragRange;
		},
		get focused() {
			return focused;
		},
		set focused(v) {
			focused = v;
		},
		get formatValue() {
			return formatValue;
		}
	});

	const field = createFieldState<'slider' | 'slider-range'>({
		id,
		get value() {
			return value === undefined ? undefined : slider.fieldValue;
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
		onValidate: (val) => slider.validate(val, onValidate),
		get visible() {
			return visible;
		},
		get type() {
			return slider.fieldType;
		}
	});

	const classes = $derived(useSliderTheme(theme));
	const groupLabel = $derived(
		typeof label === 'string' || typeof label === 'number' ? `${label}` : undefined
	);
	const hasMarks = $derived(marks.length > 0);
	const hasContainedLayout = $derived(
		variant === 'contained' && slider.orientationValue === 'horizontal' && !rest.labelPosition
	);

	const getThumbLabel = (index: number) => {
		if (thumbLabels[index]) return thumbLabels[index];
		if (!slider.isRange) return undefined;
		if (groupLabel) {
			return index === 0
				? t.sliderThumbGroupMin(groupLabel)
				: index === slider.values.length - 1
					? t.sliderThumbGroupMax(groupLabel)
					: t.sliderThumbGroupValue(groupLabel, index + 1);
		}
		return index === 0
			? t.minimumValue
			: index === slider.values.length - 1
				? t.maximumValue
				: t.sliderThumbValue(index + 1);
	};
	const setFirstThumb = (node: HTMLButtonElement | null) => {
		field.node = node;
	};
</script>

<Field
	{field}
	{size}
	label={hasContainedLayout ? undefined : label}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				disabled: slider.disabled,
				size: size
			})
		}
	}}
	{...rest}
>
	<div class={classes.root({ orientation: slider.orientationValue, size })}>
		{#each slider.values as hiddenValue, index (index)}
			<input type="hidden" name={field.name} value={hiddenValue} disabled={slider.disabled} />
		{/each}

		<div
			class={classes.control({
				orientation: slider.orientationValue,
				size,
				variant,
				marks: hasMarks
			})}
		>
			{#if hasContainedLayout && label}
				<Slot
					as="label"
					attrs={{ for: id }}
					render={label}
					class={classes.containedLabel({
						size,
						required: field.required,
						hasError: field.hasError
					})}
				/>
			{/if}

			<SliderTrack
				onFirstThumbRef={setFirstThumb}
				{id}
				{slider}
				{classes}
				color={resolvedColor}
				{variant}
				{size}
				{marks}
				{groupLabel}
				{getThumbLabel}
				{t}
			/>

			{#if showValue || valueLabel || rangeLabel}
				<SliderValueLabels
					{slider}
					{classes}
					{size}
					{variant}
					marks={hasMarks}
					{valueLabel}
					{rangeLabel}
				/>
			{/if}
		</div>
	</div>
</Field>
