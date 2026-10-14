<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import type { SliderVariant } from './slider.props.js';
	import type { SliderOrientation, SliderValuePayload } from './slider.state.svelte.js';
	import type { useSliderTheme } from './slider.theme.js';

	type SliderClasses = ReturnType<typeof useSliderTheme>;

	let {
		id,
		payload,
		label,
		describedBy,
		orientation,
		disabled,
		readOnly,
		variant,
		color,
		size,
		classes,
		onRef,
		attachment,
		hitboxAttachment
	}: {
		id: string;
		payload: SliderValuePayload;
		label?: string;
		describedBy?: string;
		orientation: SliderOrientation;
		disabled?: boolean;
		readOnly?: boolean;
		variant: SliderVariant;
		color: Colors;
		size?: Sizes;
		classes: SliderClasses;
		onRef?: (node: HTMLButtonElement | null) => void;
		attachment: Attachment<HTMLButtonElement>;
		hitboxAttachment: Attachment<HTMLElement>;
	} = $props();

	const getThumbHalfSize = () => {
		if (variant === 'thick') {
			if (size === 'small') return '10px';
			if (size === 'large') return '18px';
			return '14px';
		}
		if (variant === 'contained') {
			if (size === 'small') return '2px';
			if (size === 'large') return '4px';
			return '3px';
		}
		if (size === 'small') return '7px';
		if (size === 'large') return '10px';
		return '8px';
	};

	const getThickEdgeInset = () => '2px';
	const getThumbMinPosition = () => {
		const thumbHalfSize = getThumbHalfSize();
		if (variant === 'contained') return `calc(${thumbHalfSize} + 4px)`;
		if (variant !== 'thick') return thumbHalfSize;
		return `calc(${thumbHalfSize} + ${getThickEdgeInset()})`;
	};
	const getThumbMaxPosition = () => {
		const thumbHalfSize = getThumbHalfSize();
		if (variant === 'contained') return `calc(100% - ${thumbHalfSize} - 4px)`;
		if (variant !== 'thick') return `calc(100% - ${thumbHalfSize})`;
		return `calc(100% - ${thumbHalfSize} - ${getThickEdgeInset()})`;
	};

	const thumbPositionStyle = $derived.by(() => {
		const containedPosition = `clamp(${getThumbMinPosition()}, ${payload.percentage}%, ${getThumbMaxPosition()})`;
		// inset-inline-start mirrors a horizontal track in RTL, matching the mirrored arrow keys.
		return orientation === 'vertical'
			? `bottom: ${containedPosition};`
			: `inset-inline-start: ${containedPosition};`;
	});

	const registerRef = (node: HTMLButtonElement) => {
		onRef?.(node);
		return () => onRef?.(null);
	};
</script>

<span
	{@attach hitboxAttachment}
	aria-hidden="true"
	data-slider-thumb-hitbox
	class={classes.thumbHitbox({
		orientation,
		disabled,
		variant,
		size
	})}
	style={thumbPositionStyle}
></span>

<button
	{@attach registerRef}
	{@attach attachment}
	{id}
	type="button"
	role="slider"
	data-slider-thumb
	aria-label={label}
	aria-describedby={describedBy}
	aria-orientation={orientation}
	aria-valuemin={payload.thumbMin}
	aria-valuemax={payload.thumbMax}
	aria-valuenow={payload.value}
	aria-valuetext={payload.formatted}
	aria-readonly={readOnly || undefined}
	{disabled}
	class={classes.thumb({
		orientation,
		disabled,
		variant,
		color,
		size
	})}
	style={thumbPositionStyle}
>
	<span
		aria-hidden="true"
		data-slider-thumb-visual
		class={classes.thumbVisual({
			orientation,
			variant,
			color,
			size
		})}
	></span>
</button>
