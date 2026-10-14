<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Messages } from '$lib/i18n/en.js';
	import type { SliderMark, SliderVariant } from './slider.props.js';
	import type { SliderState } from './slider.state.svelte.js';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import type { FieldState } from '../Field/field.state.svelte.js';
	import SliderMarks from './SliderMarks.svelte';
	import SliderThumb from './SliderThumb.svelte';
	import type { useSliderTheme } from './slider.theme.js';

	type SliderClasses = ReturnType<typeof useSliderTheme>;

	let {
		id,
		slider,
		classes,
		color,
		variant,
		size,
		marks,
		field,
		groupLabelId,
		getThumbLabel,
		onFirstThumbRef,
		t
	}: {
		id: string;
		slider: SliderState;
		classes: SliderClasses;
		color: Colors;
		variant: SliderVariant;
		size?: Sizes;
		marks: SliderMark[];
		/** The field: it names the submitted inputs and says whether edits are refused. */
		field: FieldState<'slider' | 'slider-range'>;
		/** Id of the rendered label, which names the track group whatever the label is made of. */
		groupLabelId?: string;
		getThumbLabel: (index: number) => string | undefined;
		onFirstThumbRef?: (node: HTMLInputElement | null) => void;
		t: Messages;
	} = $props();

	const getThickThumbHalfSize = () => {
		if (size === 'small') return '10px';
		if (size === 'large') return '18px';
		return '14px';
	};
	const setFirstThumb = (node: HTMLInputElement | null) => {
		onFirstThumbRef?.(node);
	};
	const getThickThumbSize = () => {
		if (size === 'small') return '20px';
		if (size === 'large') return '36px';
		return '28px';
	};
	const getThickEdgeInset = () => '2px';
	const getThickRangeMinimum = () =>
		`calc(${getThickThumbSize()} + ${getThickEdgeInset()} + ${getThickEdgeInset()})`;
	const getThickRangeEndOffset = () => `calc(${getThickThumbHalfSize()} + ${getThickEdgeInset()})`;
	const getContainedRangeMinimum = () => {
		if (size === 'small') return '5px';
		if (size === 'large') return '8px';
		return '6px';
	};
	const getContainedRangeEndOffset = () => getContainedRangeMinimum();
	// FieldState names an unnamed field `${type}-input-${id}` so Form wiring stays unique. Only a
	// name the app gave, directly or through Form, is submitted, as for a native control.
	const submittedName = $derived(
		field.name === `${field.type}-input-${field.id}` ? undefined : field.name
	);
	const instructionsId = $derived(`${id}-instructions`);
	const instructions = $derived(
		slider.isRange ? t.sliderInstructionsRange : t.sliderInstructionsSingle
	);
	const shouldFillFromStart = $derived(
		!slider.isRange && (variant === 'thick' || variant === 'contained')
	);
	const rangeStartPercentage = $derived(
		slider.isRange || !shouldFillFromStart ? slider.startPercentage : 0
	);
	const rangeEndPercentage = $derived(
		slider.isRange || !shouldFillFromStart ? slider.endPercentage : slider.valuePayload.percentage
	);
	const rangeLengthPercentage = $derived(Math.max(0, rangeEndPercentage - rangeStartPercentage));
	const getRangeLength = () => {
		if (!shouldFillFromStart) return `${rangeLengthPercentage}%`;
		if (variant === 'thick') {
			return `clamp(${getThickRangeMinimum()}, calc(${rangeLengthPercentage}% + ${getThickRangeEndOffset()}), 100%)`;
		}
		return `clamp(${getContainedRangeMinimum()}, calc(${rangeLengthPercentage}% + ${getContainedRangeEndOffset()}), 100%)`;
	};
	const rangeStyle = $derived(
		slider.orientationValue === 'vertical'
			? `bottom: ${rangeStartPercentage}%; height: ${getRangeLength()};`
			: `inset-inline-start: ${rangeStartPercentage}%; width: ${getRangeLength()};`
	);
</script>

<div class={slider.orientationValue === 'vertical' ? 'relative w-auto' : 'relative w-full'}>
	<span id={instructionsId} class="sr-only">{instructions}</span>
	<div
		{@attach slider.track}
		role="group"
		class={classes.track({
			orientation: slider.orientationValue,
			size,
			color,
			variant,
			disabled: slider.disabled,
			readOnly: field.readOnly
		})}
		aria-labelledby={groupLabelId}
		aria-disabled={slider.disabled}
		data-readonly={field.readOnly ? '' : undefined}
		aria-describedby={instructionsId}
	>
		<div class={classes.trackBackground({ orientation: slider.orientationValue, variant })}></div>
		{#if variant === 'contained'}
			<div
				aria-hidden="true"
				class={classes.containedTicks({ orientation: slider.orientationValue })}
			>
				{#each [10, 20, 30, 40, 50, 60, 70, 80, 90] as percentage (percentage)}
					<span
						class={classes.containedTick({ orientation: slider.orientationValue, size })}
						style={slider.orientationValue === 'vertical'
							? `bottom: ${percentage}%;`
							: `inset-inline-start: ${percentage}%;`}
					></span>
				{/each}
			</div>
		{/if}
		<div
			{@attach slider.range}
			role="presentation"
			class={classes.range({
				orientation: slider.orientationValue,
				variant,
				size,
				dragRange: slider.canDragRange
			})}
			style={rangeStyle}
		></div>

		{#each slider.valuePayloads as payload (payload.index)}
			<SliderThumb
				onRef={payload.index === 0 ? setFirstThumb : undefined}
				id={payload.index === 0 ? id : `${id}-thumb-${payload.index}`}
				{payload}
				label={getThumbLabel(payload.index)}
				describedBy={instructionsId}
				orientation={slider.orientationValue}
				disabled={slider.isThumbDisabled(payload.index)}
				readOnly={field.readOnly}
				required={field.required}
				name={submittedName}
				{variant}
				{color}
				{size}
				{classes}
				attachment={slider.thumb(payload.index)}
				inputAttachment={slider.thumbInput(payload.index)}
				hitboxAttachment={slider.thumbHitbox(payload.index)}
			/>
			{#if slider.isThumbLocked(payload.index)}
				<!-- A disabled range input submits nothing; the thumb keeps its place in the value. -->
				<FieldHiddenInputs {field} value={payload.value} name={submittedName} />
			{/if}
		{/each}
	</div>

	<SliderMarks {marks} {slider} {classes} {size} />
</div>
