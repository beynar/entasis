<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Messages } from '$lib/i18n/en.js';
	import type { SliderMark, SliderVariant } from './slider.props.js';
	import type { SliderState } from './slider.state.svelte.js';
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
		groupLabel,
		getThumbLabel,
		onFirstThumbRef,
		readOnly,
		t
	}: {
		id: string;
		slider: SliderState;
		classes: SliderClasses;
		color: Colors;
		variant: SliderVariant;
		size?: Sizes;
		marks: SliderMark[];
		groupLabel?: string;
		getThumbLabel: (index: number) => string | undefined;
		onFirstThumbRef?: (node: HTMLButtonElement | null) => void;
		/** Edits are refused: every thumb exposes aria-readonly, not only the first one. */
		readOnly?: boolean;
		t: Messages;
	} = $props();

	const getThickThumbHalfSize = () => {
		if (size === 'small') return '10px';
		if (size === 'large') return '18px';
		return '14px';
	};
	const setFirstThumb = (node: HTMLButtonElement | null) => {
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
			disabled: slider.disabled
		})}
		aria-label={groupLabel}
		aria-disabled={slider.disabled}
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
				dragRange: !!slider.dragRange && slider.isRange
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
				disabled={slider.disabled}
				{readOnly}
				{variant}
				{color}
				{size}
				{classes}
				attachment={slider.thumb(payload.index)}
				hitboxAttachment={slider.thumbHitbox(payload.index)}
			/>
		{/each}
	</div>

	<SliderMarks {marks} {slider} {classes} {size} />
</div>
