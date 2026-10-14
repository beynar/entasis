<script lang="ts">
	import { untrack } from 'svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState, type FieldState } from '../Field/field.state.svelte.js';
	import SliderTrack from './SliderTrack.svelte';
	import SliderValueLabels from './SliderValueLabels.svelte';
	import type { SliderProps } from './slider.props.js';
	import { SliderState } from './slider.state.svelte.js';
	import { useSliderTheme } from './slider.theme.js';
	import { useI18n, useI18nDirection } from '$lib/i18n/context.svelte.js';
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
		readOnly,
		messages,
		name,
		onValidate,
		visible,
		onValueChange,
		onValueCommit,
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
		thumbCollisionBehavior = 'none',
		thumbDisabled,
		largeStep,
		dragRange = false,
		thumbLabels = [],
		size = 'normal',
		i18n,
		label,
		fieldAttrs,
		...rest
	}: SliderProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const t = $derived(useI18n(i18n));
	// An i18n direction that the document does not carry still has to mirror the whole field, so
	// the label lines up with the track and the thumbs' logical positions agree with the arrow
	// keys and the pointer reading, which follow that direction too.
	const contextualDirection = $derived(useI18nDirection());
	const directionAttributes = $derived(contextualDirection ? { dir: contextualDirection } : {});
	const resolvedColor = $derived(useDefaultColor(color));

	const id = $props.id();

	const slider: SliderState = new SliderState({
		get value() {
			return value;
		},
		set value(v) {
			field.setValue(v);
		},
		get mode() {
			return mode;
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
		get largeStep() {
			return largeStep;
		},
		get thumbs() {
			return thumbs ?? (mode === 'range' ? 2 : undefined);
		},
		get minStepsBetweenThumbs() {
			return minStepsBetweenThumbs;
		},
		get thumbCollisionBehavior() {
			return thumbCollisionBehavior;
		},
		get thumbDisabled() {
			return thumbDisabled;
		},
		get orientation() {
			return orientation;
		},
		// The field's effective state: its own, or a disabled Form or group around it.
		get disabled(): boolean {
			return field.disabled;
		},
		// Refused edits: the field's effective read-only state, or that of a Form around it.
		get readOnly(): boolean {
			return field.readOnly;
		},
		get dragRange() {
			return dragRange;
		},
		get onValueCommit() {
			return onValueCommit;
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

	// The field reads the slider value only through `fieldValue`, which keeps one plain array while
	// the numbers are unchanged: a Form that writes the value back as a new proxy is not a change.
	const hasValue = $derived(value !== undefined);

	const field: FieldState<'slider' | 'slider-range'> = createFieldState<'slider' | 'slider-range'>({
		id,
		get value() {
			return hasValue ? slider.fieldValue : undefined;
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
	const setFirstThumb = (node: HTMLInputElement | null) => {
		field.node = node;
	};
</script>

<Field
	{field}
	{size}
	label={hasContainedLayout ? undefined : label}
	fieldAttrs={{ ...fieldAttrs, ...directionAttributes }}
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
					attrs={{ for: id, id: field.labelId }}
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
				{field}
				groupLabelId={label ? field.labelId : undefined}
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
